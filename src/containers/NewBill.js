import { ROUTES_PATH } from "../constants/routes.js"
import Logout from "./Logout.js";
import ErrorPage from "../views/ErrorPage.js";

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    this.localStorage = localStorage
    this.billId = null // Obligatoire pour récupérer l'image (la facture : key)
    // handleChangeFile utilise this.email , handleChangeFile est appelé avant handleSubmit donc this.email DOIT exister dès l’instanciation du container
    const user = JSON.parse(this.localStorage.getItem("user"))
    this.email = user.email

    // Le logout ne réagissait pas ici car chaque container doit instancier Logout lui-même / Le Lougout est un comportement non une vue donc dans containers
    this.logout = new Logout({
      document,
      localStorage,
      onNavigate,
    })
    // console.log("Logout attached (dès qu'on arrive sur NewBills)")

    this.fileName = null
    this.fileUrl = null

    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)

    const fileInput = this.document.querySelector(`input[data-testid="file"]`)
    fileInput.addEventListener("change", this.handleChangeFile)

    // On ajoute la fonctionnalité du bouton "Annuler" ajouter dans NewBillUi.js
    const cancelBtn = this.document.querySelector(
      '[data-testid="cancel-btn"]'
    )
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.onNavigate(ROUTES_PATH["Bills"])
      })
    }
  }

handleChangeFile = e => {
  const file = e.target.files[0]
  // La condition protège toute la chaîne
  if (!file) return // Ici la condition car : file peut être undefined, file.name sans vérification = crash silencieux / Si crash silencieux : this.fileUrl jamais défini, this.fileName jamais défini et submit → "Fichier manquant"
  const fileName = file.name
  const extension = fileName.split('.').pop().toLowerCase()
  const allowedExtensions = ['jpg', 'jpeg', 'png']

  if (!allowedExtensions.includes(extension)) {
    e.target.value = null
    alert('Veuillez sélectionner un fichier jpg, jpeg ou png')
    return
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('email', this.email)

  this.store
    .bills()
    .create({
      data: formData,
      headers: { noContentType: true },
    })
    .then(({ filePath, key }) => {
      this.fileUrl = filePath // son vrai nom dans la BDD : filePath / On ne touche pas la BDD et on permet au front de chercher la bonne info
      this.fileName = fileName
      this.billId = key
    })
    .catch(error => console.error(error))
}


  handleSubmit = e => {
    e.preventDefault()

    // 1) On récupère les valeurs comme dans ton code actuel
    const type = this.document.querySelector(`select[data-testid="expense-type"]`).value
    const name = this.document.querySelector(`input[data-testid="expense-name"]`).value
    const date = this.document.querySelector(`input[data-testid="datepicker"]`).value
    const amount = parseInt(this.document.querySelector(`input[data-testid="amount"]`).value)
    const pct = parseInt(this.document.querySelector(`input[data-testid="pct"]`).value) || 0
    const vat = parseInt(this.document.querySelector(`input[data-testid="vat"]`).value) || 0
    const commentary = this.document.querySelector(`input[data-testid="expense-coment"]`)?.value || ""

    // Scénario 6 employee = empêcher la création d’une note de frais avec champs manquants
    // 2) Validation des champs obligatoires pour afficher un message d'erreur sous chaque champ
    const fields = [
      { value: type, errorId: "error-type" },
      { value: name, errorId: "error-name" },
      { value: date, errorId: "error-datepicker" },
      { value: amount, errorId: "error-amount" },
      { value: vat, errorId: "error-vat" },
      { value: pct, errorId: "error-pct" },
      { value: this.fileName, errorId: "error-file" } // justificatif
    ]

    let hasError = false

    // 3) On parcourt chaque champ pour afficher un message si vide
    fields.forEach(f => {
      const errorSpan = this.document.querySelector(`[data-testid="${f.errorId}"]`)
      if (!f.value || f.value === "") {
        if (errorSpan) {
          errorSpan.textContent = "Merci de remplir ce champ"
          errorSpan.style.color = "red"
        }
        hasError = true
      } else {
        if (errorSpan) errorSpan.textContent = ""
      }
    })

    // 4) Si un champ obligatoire est vide on stoppe ici, la note ne sera pas créée
    if (hasError) return

    // 5) Vérification supplémentaire pour le fichier et billId
    if (!this.fileUrl) {
      console.error("Fichier manquant")
      return
    }
    if (!this.billId) {
      console.error("Bill ID manquant")
      return
    }

    // 6) Création de l'objet bill
    const email = JSON.parse(this.localStorage.getItem("user")).email
    const bill = {
      email,
      type,
      name,
      date,
      amount,
      vat,
      pct,
      commentary,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    }

    // 7) Envoi de la note au store
    if (this.store) {
      this.store
        .bills()
        .update({
          data: JSON.stringify(bill),
          selector: this.billId,
        })
        .then(() => this.onNavigate(ROUTES_PATH["Bills"]))
        .catch(error => {
          console.error(err)
          this.onNavigate(ROUTES_PATH['Error'], { error: err.message })
        })
    } else {
      this.onNavigate(ROUTES_PATH["Bills"])
    }
  }

}
