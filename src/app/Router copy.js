import store from "./Store.js"
import Login, { PREVIOUS_LOCATION } from "../containers/Login.js"
import Bills from "../containers/Bills.js"
import NewBill from "../containers/NewBill.js"
import Dashboard from "../containers/Dashboard.js"

import BillsUI from "../views/BillsUI.js"
import DashboardUI from "../views/DashboardUI.js"

import { ROUTES, ROUTES_PATH } from "../constants/routes.js"

export default () => {
  const rootDiv = document.getElementById('root')
  rootDiv.innerHTML = ROUTES({ pathname: window.location.pathname })
  const AUTHORIZED_ROUTES = Object.values(ROUTES_PATH)

  // ===============================
  // Fonction de navigation principale
  // ===============================
  window.onNavigate = (pathname) => {

    // ===============================
    // routes inconnues = 404
    // ===============================
    if (!AUTHORIZED_ROUTES.includes(pathname)) {
      rootDiv.innerHTML = ROUTES({
        pathname,
        error: "Erreur 404 : page introuvable"
      })
      return  
    }

    window.history.pushState({}, pathname, window.location.origin + pathname)

    // ===============================
    // ROUTE LOGIN
    // ===============================
    if (pathname === ROUTES_PATH['Login']) {
      rootDiv.innerHTML = ROUTES({ pathname })
      document.body.style.backgroundColor = "#0E5AE5"
      new Login({ document, localStorage, onNavigate, PREVIOUS_LOCATION, store })

    // ===============================
    // ROUTE BILLS
    // ===============================
    } else if (pathname === ROUTES_PATH['Bills']) {
      rootDiv.innerHTML = ROUTES({ pathname, loading: true })
      const divIcon1 = document.getElementById('layout-icon1')
      const divIcon2 = document.getElementById('layout-icon2')
      divIcon1.classList.add('active-icon')
      divIcon2.classList.remove('active-icon')

      const bills = new Bills({ document, onNavigate, store, localStorage })
      bills.getBills()
        .then(data => {
          rootDiv.innerHTML = BillsUI({ data })
          divIcon1.classList.add('active-icon')
          divIcon2.classList.remove('active-icon')
          new Bills({ document, onNavigate, store, localStorage })
        })
        .catch(error => {
          // Scénarios 10 + 11 Employee : gestion 404 / 500 / autre
          if (error.status === 404 || error.status === 500) {
            rootDiv.innerHTML = ROUTES({ pathname, error: error.message })
          } else {
            rootDiv.innerHTML = ROUTES({ pathname, error: "Une erreur est survenue" })
          }
        })

    // ===============================
    // ROUTE NEW BILL
    // ===============================
    } else if (pathname === ROUTES_PATH['NewBill']) {
      rootDiv.innerHTML = ROUTES({ pathname, loading: true })
      new NewBill({ document, onNavigate, store, localStorage })
      divIcon1.classList.remove('active-icon')
      divIcon2.classList.add('active-icon')

    // ===============================
    // ROUTE DASHBOARD
    // ===============================
    } else if (pathname === ROUTES_PATH['Dashboard']) {
      rootDiv.innerHTML = ROUTES({ pathname, loading: true })
      const dashboard = new Dashboard({ document, onNavigate, store, bills: [], localStorage })
      dashboard.getBillsAllUsers()
        .then(bills => {
          rootDiv.innerHTML = DashboardUI({ data: { bills } })
          new Dashboard({ document, onNavigate, store, bills, localStorage })
        })
        .catch(error => {
          rootDiv.innerHTML = ROUTES({ pathname, error })
        })
    }
  }

  // ===============================
  // Gestion du retour arrière et hash invalides = scenario 4 employee
  // ===============================
  window.onpopstate = () => {
    const user = JSON.parse(localStorage.getItem("user"))
    const currentHash = window.location.hash

    // Routes invalides → afficher 404
    if (!AUTHORIZED_ROUTES.includes(currentHash)) {
      rootDiv.innerHTML = ROUTES({
        pathname: currentHash,
        error: "Erreur 404 : page introuvable"
      })
      return
    }

    // Scénario 12 admin + 8 employee : empêcher retour vers login
    if (user) {
      const pathname = user.type === "Admin"
        ? ROUTES_PATH['Dashboard']
        : ROUTES_PATH['Bills']

      window.history.replaceState({}, "", pathname)
      onNavigate(pathname)

    // Si non connecté → login
    } else {
      onNavigate(ROUTES_PATH['Login'])
      document.body.style.backgroundColor = "#0E5AE5"
    }
  }

  // ===============================
  // Initialisation de la page au chargement
  // ===============================
  if (window.location.pathname === "/" && window.location.hash === "") {
    new Login({ document, localStorage, onNavigate, PREVIOUS_LOCATION, store })
    document.body.style.backgroundColor = "#0E5AE5"
  } else if (window.location.hash !== "") {
    onNavigate(window.location.hash)
  }

  return null
}
