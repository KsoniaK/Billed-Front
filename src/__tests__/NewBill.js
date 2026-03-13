/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import store from "../__mocks__/store.js"

// Setup localStorage et rôle
beforeEach(() => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock })
  window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }))
  document.body.innerHTML = NewBillUI()
})

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {

    // Test upload fichier valide
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

    // Test rejet fichier invalide
    test("It should reject an invalid file format and trigger alert", async () => {
      const newBill = new NewBill({ document, onNavigate: jest.fn(), store, localStorage: window.localStorage })
      const input = screen.getByTestId("file")

      window.alert = jest.fn()
      const file = new File(["test"], "facture.pdf", { type: "application/pdf" })

      fireEvent.change(input, { target: { files: [file] } })

      expect(newBill.fileName).toBe(undefined)
      expect(window.alert).toHaveBeenCalled()
    })

    // Test soumission formulaire et navigation
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

    // Test log erreur si fileUrl ou billId manquant
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
      // Ce test d’intégration simule l’ensemble du processus
    test("It should create a new bill via mock API (integration POST)", async () => {
      // On simule la navigation dans l'app avec onNavigate
      const onNavigate = jest.fn((pathname) => {
        document.body.innerHTML = ROUTES_PATH[pathname] || ""
      })

      // On crée le container NewBill
      const newBill = new NewBill({ document, onNavigate, store, localStorage: window.localStorage })

      // On simule que l’utilisateur remplit le formulaire avec des valeurs.
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

      // Fichier mocké : On simule un fichier uploadé.
      newBill.fileName = "facture.png"
      newBill.fileUrl = "https://localhost:3456/images/test.jpg"
      newBill.billId = "1234"

      // On espionne la méthode update du store pour vérifier qu’elle est appelée lors du submit. / mockResolvedValue({}) → simule une promesse résolue (succès de l’API).
      const spyUpdate = jest.spyOn(store.bills(), "update").mockResolvedValue({})

      // On ajoute l’event listener du formulaire, exactement comme dans l’appli.
      const form = screen.getByTestId("form-new-bill")
      form.addEventListener("submit", (e) => newBill.handleSubmit(e))

      // fireEvent.submit(form) simule un clic sur le bouton “envoyer”.
      fireEvent.submit(form)

      // waitFor est nécessaire car handleSubmit est async.
      await waitFor(() => {
        expect(spyUpdate).toHaveBeenCalled()  // spyUpdate -> on s’assure que la méthode update du store a été appelée avec la nouvelle facture.
        // onNavigate -> on s’assure que l’utilisateur est redirigé vers la page Bills après la création.
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]) 
      })
    })

    // Tests gestion erreurs API
    describe("When submitting a new bill and the API returns an error", () => {

      // Test erreur 404
      test("It should handle 404 error", async () => {
        const onNavigate = jest.fn()
        const newBill = new NewBill({ document, onNavigate, store, localStorage: window.localStorage })

        // Pré-remplissage formulaire
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

        const form = screen.getByTestId("form-new-bill")
        form.addEventListener("submit", (e) => newBill.handleSubmit(e))

        // Mock erreur 404
        jest.spyOn(store.bills(), "update").mockRejectedValueOnce({ message: "Erreur 404" })
        window.alert = jest.fn() // Espionner alert

        fireEvent.submit(form)

        await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Erreur 404"))
      })

      // Test erreur 500
      test("It should handle 500 error", async () => {
        const onNavigate = jest.fn()
        const newBill = new NewBill({ document, onNavigate, store, localStorage: window.localStorage })

        // Pré-remplissage formulaire
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

        const form = screen.getByTestId("form-new-bill")
        form.addEventListener("submit", (e) => newBill.handleSubmit(e))

        // Mock erreur 500
        jest.spyOn(store.bills(), "update").mockRejectedValueOnce({ message: "Erreur 500" })
        window.alert = jest.fn() // Espionner alert

        fireEvent.submit(form)

        await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Erreur 500"))
      })

    })

  })
})