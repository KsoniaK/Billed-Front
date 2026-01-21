/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

// Jest n'a pas de vrai DOM, avec jQuery / Bootstrap donc modal() n'existe pas = "TypeError: $(...).modal is not a function"
// En test on doit donc mock cette fonction, ça évite cette erreur 
beforeAll(() => {
  // Mock de la fonction modal de jQuery
  $.fn.modal = jest.fn();
});


describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
  });

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    // AJOUT de tests pour couvrir 80% containers/Bills (1-3)
    // 1- Couvrir getBills() quand le store renvoie un tableau vide (containers/Bills l.68-71)
    describe("getBills method", () => {
      test("should throw 404 if store.list returns empty array", async () => {
        const mockStore = { bills: () => ({ list: jest.fn().mockResolvedValue([]) }) };
        const billsContainer = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });
        await expect(billsContainer.getBills()).rejects.toEqual({
          status: 404,
          message: "Bills introuvables"
        });
      });
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map(a => a.innerHTML);
      const antiChrono = (a, b) => ((a < b) ? 1 : -1);
      // Vérifier le tri réel, on teste le comportement utilisateur
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test("Then clicking on the eye icon should open modal with the image", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const billsContainer = new Bills({ document, onNavigate: jest.fn(), store: { bills: () => ({ list: jest.fn() }) }, localStorage: window.localStorage });
      const firstEyeIcon = screen.getAllByTestId("icon-eye")[0];
      fireEvent.click(firstEyeIcon);
      const modal = document.getElementById("modaleFile");
      expect(modal.style.display !== "none").toBeTruthy();
      expect(modal.querySelector("img")).toBeTruthy();
    });

    describe("When there is a server error", () => {
      test("Then a 404 error displays ErrorPage", async () => {
        const mockStore = {
          bills: () => ({
            list: jest.fn().mockRejectedValue({ message: "Erreur 404" })
          })
        };
        const billsContainer = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });
        const billsData = await billsContainer.getBills().catch(err => err);
        expect(billsData.message).toBe("Erreur 404");
      });

      test("Then a 500 error displays ErrorPage", async () => {
        const mockStore = {
          bills: () => ({
            list: jest.fn().mockRejectedValue({ message: "Erreur 500" })
          })
        };
        const billsContainer = new Bills({ document, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });
        const billsData = await billsContainer.getBills().catch(err => err);
        expect(billsData.message).toBe("Erreur 500");
      });

    // 2- Couvrir le catch final (containers/Bills l.82-89). On force une erreur non standard dans le store :
    describe("When getBills throws an unknown error", () => {
      test("Then it should return a 500 error with default message", async () => {
        const mockStore = {
          bills: () => ({
            list: jest.fn().mockRejectedValue({})
          })
        };
        const billsContainer = new Bills({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage
        });
        await expect(billsContainer.getBills()).rejects.toEqual({
          status: 500,
          message: "Erreur serveur"
        });
      });
    });

    // 3-test d'intégration GET Bills
    describe("Given I am a user connected as Employee", () => {
      describe("When I navigate to Bills page", () => {
        test("fetches bills from mock API GET", async () => {
          Object.defineProperty(window, "localStorage", { value: localStorageMock })
          window.localStorage.setItem(
            "user",
            JSON.stringify({ type: "Employee", email: "a@a" })
          )

          const root = document.createElement("div")
          root.setAttribute("id", "root")
          document.body.append(root)

          router()
          window.onNavigate(ROUTES_PATH['Bills'])

          await waitFor(() => screen.getByText(/Mes notes de frais/i))

          expect(screen.getAllByTestId("icon-eye").length).toBeGreaterThan(0)
        })
      })
    })

// ==============================
// Tests unitaires pour views/BillsUI
// ==============================

  describe("BillsUI", () => {

    describe("When loading is true", () => {
      test("Displays LoadingPage", () => {
        document.body.innerHTML = BillsUI({ data: [], loading: true })

        expect(screen.getByText(/loading/i)).toBeTruthy()
      })
    })

    describe("When there is an error", () => {
      test("Displays ErrorPage", () => {
        document.body.innerHTML = BillsUI({
          data: [],
          error: "Erreur 404"
        })

        expect(screen.getByText(/Erreur 404/i)).toBeTruthy()
      })
    })

    describe("When there are no bills", () => {
      test("tbody should be empty", () => {
        document.body.innerHTML = BillsUI({ data: [] })

        const tbody = screen.getByTestId("tbody")
        expect(tbody.querySelectorAll("tr").length).toBe(0)
      })
    })

    describe("When bills contain corrupted date", () => {
      test("Still displays bill information", () => {
        const badBills = [
          {
            type: "Transports",
            name: "Corrupted",
            date: "invalid-date",
            amount: 100,
            status: "pending",
            fileUrl: "#"
          }
        ]

        document.body.innerHTML = BillsUI({ data: badBills })

        expect(screen.getByText("Corrupted")).toBeTruthy()
      })
    })

  })



    });
  });
});
