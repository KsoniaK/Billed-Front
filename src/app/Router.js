import store from "./Store.js"
import Login, { PREVIOUS_LOCATION } from "../containers/Login.js"
import Bills  from "../containers/Bills.js"
import NewBill from "../containers/NewBill.js"
import Dashboard from "../containers/Dashboard.js"

import BillsUI from "../views/BillsUI.js"
import DashboardUI from "../views/DashboardUI.js"

import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import ErrorPage from "../views/ErrorPage.js"

const AUTHORIZED_ROUTES = Object.values(ROUTES_PATH)
// console.log(AUTHORIZED_ROUTES);


export default () => {
  const rootDiv = document.getElementById('root')
  rootDiv.innerHTML = ROUTES({ pathname: window.location.pathname })

  window.onNavigate = (pathname) => {
    // Ici on vérifie si route existe, si non = 404
    if (!AUTHORIZED_ROUTES.includes(pathname)) {  
      console.log(pathname);
      rootDiv.innerHTML = ErrorPage()
      return
    }

    window.history.pushState(
      {},
      pathname,
      window.location.origin + pathname
    )
    if (pathname === ROUTES_PATH['Login']) {
      rootDiv.innerHTML = ROUTES({ pathname })
      document.body.style.backgroundColor="#0E5AE5"
      new Login({ document, localStorage, onNavigate, PREVIOUS_LOCATION, store })
    } else if (pathname === ROUTES_PATH['Bills']) {
      rootDiv.innerHTML = ROUTES({ pathname, loading: true })
      const divIcon1 = document.getElementById('layout-icon1')
      const divIcon2 = document.getElementById('layout-icon2')
      divIcon1.classList.add('active-icon')
      divIcon2.classList.remove('active-icon')
      const bills = new Bills({ document, onNavigate, store, localStorage  })
      bills.getBills().then(data => {
        rootDiv.innerHTML = BillsUI({ data })
        const divIcon1 = document.getElementById('layout-icon1')
        const divIcon2 = document.getElementById('layout-icon2')
        divIcon1.classList.add('active-icon')
        divIcon2.classList.remove('active-icon')
        new Bills({ document, onNavigate, store, localStorage })
        // Empêche le retour en arrière
        location.reload()
      }).catch(error => {
        rootDiv.innerHTML = ROUTES({ pathname, error })
      })
    } else if (pathname === ROUTES_PATH['NewBill']) {
      rootDiv.innerHTML = ROUTES({ pathname, loading: true })
      new NewBill({ document, onNavigate, store, localStorage })
      const divIcon1 = document.getElementById('layout-icon1')
      const divIcon2 = document.getElementById('layout-icon2')
      divIcon1.classList.remove('active-icon')
      divIcon2.classList.add('active-icon')
    } else if (pathname === ROUTES_PATH['Dashboard']) {
      rootDiv.innerHTML = ROUTES({ pathname, loading: true })
      const bills = new Dashboard({ document, onNavigate, store, bills: [], localStorage })
      bills.getBillsAllUsers().then(bills => {
          rootDiv.innerHTML = DashboardUI({data: {bills}})
          new Dashboard({document, onNavigate, store, bills, localStorage})
          // Empêche le retour en arrière
          location.reload()
        }).catch(error => {
        rootDiv.innerHTML = ROUTES({ pathname, error })
      })
    }
  }

  // On empêche le retour en arrière (avec reload dans onNavigate pour Bills et Dasboard / à chaque clic en arrière on reload (voir si technique n'est pas mauvaise pratique))
  window.onpopstate = (e) => {
    // console.log(e);
    // console.log(e.target.location.href);
    const user = JSON.parse(localStorage.getItem('user'))

    if (!user) {
      document.body.style.backgroundColor="#0E5AE5"
      onNavigate(ROUTES_PATH['Login'])
    }
    else if (user.type === 'Employee') {
      onNavigate(ROUTES_PATH['Bills'])
    }
    else if (user.type === 'Admin') {
      onNavigate(ROUTES_PATH['Dashboard'])
    }
  }

  if (window.location.pathname === "/" && window.location.hash === "") {
    new Login({ document, localStorage, onNavigate, PREVIOUS_LOCATION, store })
    document.body.style.backgroundColor="#0E5AE5"
  }
   else if (window.location.hash !== "") {
    if (window.location.hash === ROUTES_PATH['Bills']) {
      rootDiv.innerHTML = ROUTES({ pathname: window.location.hash, loading: true })
      const divIcon1 = document.getElementById('layout-icon1')
      const divIcon2 = document.getElementById('layout-icon2')
      divIcon1.classList.add('active-icon')
      divIcon2.classList.remove('active-icon')
      const bills = new Bills({ document, onNavigate, store, localStorage  })
      bills.getBills().then(data => {
        rootDiv.innerHTML = BillsUI({ data })
        const divIcon1 = document.getElementById('layout-icon1')
        const divIcon2 = document.getElementById('layout-icon2')
        divIcon1.classList.add('active-icon')
        divIcon2.classList.remove('active-icon')
        new Bills({ document, onNavigate, store, localStorage })
      }).catch(error => {
        rootDiv.innerHTML = ROUTES({ pathname: window.location.hash, error })
      })
    } else if (window.location.hash === ROUTES_PATH['NewBill']) {
      rootDiv.innerHTML = ROUTES({ pathname: window.location.hash, loading: true })
      new NewBill({ document, onNavigate, store, localStorage })
      const divIcon1 = document.getElementById('layout-icon1')
      const divIcon2 = document.getElementById('layout-icon2')
      divIcon1.classList.remove('active-icon')
      divIcon2.classList.add('active-icon')
    } else if (window.location.hash === ROUTES_PATH['Dashboard']) {
      rootDiv.innerHTML = ROUTES({ pathname: window.location.hash, loading: true })
      const bills = new Dashboard({ document, onNavigate, store, bills: [], localStorage })
      bills.getBillsAllUsers().then(bills => {
        rootDiv.innerHTML = DashboardUI({ data: { bills } })
        new Dashboard({ document, onNavigate, store, bills, localStorage })
      }).catch(error => {
        rootDiv.innerHTML = ROUTES({ pathname: window.location.hash, error })
      })
    } 
    // else if(window.location.hash != '#employee/bills' && window.location.hash != '#employee/bill/new' && window.location.hash != '#admin/dashboard'){
    //     rootDiv.innerHTML = ErrorPage()
    // }
  }

  return null
}