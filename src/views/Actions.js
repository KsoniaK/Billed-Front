import eyeBlueIcon from "../assets/svg/eye_blue.js"
import downloadBlueIcon from "../assets/svg/download_blue.js"

// export default (billUrl) => {
//   return (
//     `<div class="icon-actions">
//       <div id="eye" data-testid="icon-eye" data-bill-url=${billUrl}>
//       ${eyeBlueIcon}
//       </div>
//     </div>`
//   )
// }

export default (billUrl) => {
  return (
    `<div class="icon-actions">
      <div
        id="eye"
        data-testid="icon-eye"
        data-bill-url="${billUrl}">
        ${eyeBlueIcon}
      </div>
      <a
        href="${billUrl}"
        download
        target="_blank"
        rel="noopener noreferrer"
        data-testid="icon-download">
        ${downloadBlueIcon}
      </a>
    </div>`
  )
}
