/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import store from "../__mocks__/store.js"

// Setup localStorage et role
beforeEach(() => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock })
  window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }))
  document.body.innerHTML = NewBillUI()
})

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {

    test("It should accept a valid file upload", async () => {
      const newBill = new NewBill({ document, onNavigate: jest.fn(), store, localStorage: window.localStorage })
      const input = screen.getByTestId("file")

      // Fichier valide
      const file = new File(["test"], "facture.png", { type: "image/png" })
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(newBill.fileName).toBe("facture.png")
        expect(newBill.fileUrl).toBe("https://localhost:3456/images/test.jpg")
        expect(newBill.billId).toBe("1234")
      })
    })

    test("It should reject an invalid file format and trigger alert", async () => {
      const newBill = new NewBill({ document, onNavigate: jest.fn(), store, localStorage: window.localStorage })
      const input = screen.getByTestId("file")

      window.alert = jest.fn()
      const file = new File(["test"], "facture.pdf", { type: "application/pdf" })

      fireEvent.change(input, { target: { files: [file] } })

      expect(newBill.fileName).toBe(undefined)
      expect(window.alert).toHaveBeenCalled()
    })

    test("It should submit a new bill and navigate to Bills page", async () => {
      const onNavigate = jest.fn((pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname] || ""
      })

      const newBill = new NewBill({ document, onNavigate, store, localStorage: window.localStorage })

      // Remplissage formulaire
      screen.getByTestId("expense-type").value = "Transports"
      screen.getByTestId("expense-name").value = "Test Name"
      screen.getByTestId("datepicker").value = "2026-01-15"
      screen.getByTestId("amount").value = "123"
      screen.getByTestId("vat").value = "20"
      screen.getByTestId("pct").value = "10"

      const commentary = document.createElement("textarea")
      commentary.setAttribute("data-testid", "commentary")
      commentary.value = "Commentaire"
      document.body.appendChild(commentary)

      // Mock fichier déjà chargé
      newBill.fileName = "facture.png"
      newBill.fileUrl = "https://localhost:3456/images/test.jpg"
      newBill.billId = "1234"

      const spyUpdate = jest.spyOn(store.bills(), "update").mockResolvedValue({})

      const form = screen.getByTestId("form-new-bill")
      form.addEventListener("submit", (e) => newBill.handleSubmit(e))

      fireEvent.submit(form)

      await waitFor(() => {
        expect(spyUpdate).toHaveBeenCalled()
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"])
      })
    })

    test("It should log error if fileUrl or billId is missing", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {})
      const newBill = new NewBill({ document, onNavigate: jest.fn(), store, localStorage: window.localStorage })

      const form = screen.getByTestId("form-new-bill")
      form.addEventListener("submit", (e) => newBill.handleSubmit(e))

      // Sans fileUrl ni billId
      fireEvent.submit(form)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled()
      })

      consoleError.mockRestore()
    })

    // Test d'intégration POST
    test("It should create a new bill via mock API (integration POST)", async () => {
      const onNavigate = jest.fn((pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname] || ""
      })

      const newBill = new NewBill({ document, onNavigate, store, localStorage: window.localStorage })

      // Remplir formulaire
      screen.getByTestId("expense-type").value = "Transports"
      screen.getByTestId("expense-name").value = "Test Name"
      screen.getByTestId("datepicker").value = "2026-01-15"
      screen.getByTestId("amount").value = "123"
      screen.getByTestId("vat").value = "20"
      screen.getByTestId("pct").value = "10"

      const commentary = document.createElement("textarea")
      commentary.setAttribute("data-testid", "commentary")
      commentary.value = "Commentaire"
      document.body.appendChild(commentary)

      // Fichier mocké
      newBill.fileName = "facture.png"
      newBill.fileUrl = "https://localhost:3456/images/test.jpg"
      newBill.billId = "1234"

      const spyUpdate = jest.spyOn(store.bills(), "update").mockResolvedValue({})

      const form = screen.getByTestId("form-new-bill")
      form.addEventListener("submit", (e) => newBill.handleSubmit(e))

      fireEvent.submit(form)

      await waitFor(() => {
        expect(spyUpdate).toHaveBeenCalled()
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"])
      })
    })

    test("It should handle API errors (404 / 500)", async () => {
      const onNavigate = jest.fn()
      const newBill = new NewBill({ document, onNavigate, store, localStorage: window.localStorage })
      const form = screen.getByTestId("form-new-bill")
      form.addEventListener("submit", (e) => newBill.handleSubmit(e))

      // Mock erreurs
      jest.spyOn(store.bills(), "update").mockRejectedValueOnce({ message: "Erreur 404" })
      console.error = jest.fn()
      fireEvent.submit(form)
      await waitFor(() => expect(console.error).toHaveBeenCalledWith("Erreur 404"))

      jest.spyOn(store.bills(), "update").mockRejectedValueOnce({ message: "Erreur 500" })
      fireEvent.submit(form)
      await waitFor(() => expect(console.error).toHaveBeenCalledWith("Erreur 500"))
    })
  })
})
