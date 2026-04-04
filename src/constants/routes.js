import LoginUI from "../views/LoginUI.js"
import BillsUI from "../views/BillsUI.js"
import NewBillUI from "../views/NewBillUI.js"
import DashboardUI from "../views/DashboardUI.js"
import ErrorPage from "../views/ErrorPage.js"

export const ROUTES_PATH = {
  Login: '/',
  Bills: '#employee/bills',
  NewBill : '#employee/bill/new',
  Dashboard: '#admin/dashboard'
  // ErrorPage: [
  //   '#employee/bills/',
  //   '#employee/bill/new/',
  //   '#admin/dashboard/'
  // ]
}

// export const ROUTES = ({ pathname, data, error, loading }) => {
//   switch (pathname) {
//     case ROUTES_PATH['Login']:
//       return LoginUI({ data, error, loading })
//     case ROUTES_PATH['Bills']:
//       return BillsUI({ data, error, loading })
//     case ROUTES_PATH['NewBill']:
//       return NewBillUI()
//     case ROUTES_PATH['Dashboard']:
//       return DashboardUI({ data, error, loading })
//     case ROUTES_PATH['Error']:
//       return ErrorPage({ error })
//     default:
//       return LoginUI({ data, error, loading })
//   }
// }


export const ROUTES = ({ pathname, data, error, loading }) => {
  switch (pathname) {
    case ROUTES_PATH['Login']:
      return LoginUI({ data, error, loading })
    case ROUTES_PATH['Bills']:
      return BillsUI({ data, error, loading })
    case ROUTES_PATH['NewBill']:
      return NewBillUI()
    case ROUTES_PATH['Dashboard']:
      return DashboardUI({ data, error, loading })
    default:
      return ErrorPage(error)
  }
}


