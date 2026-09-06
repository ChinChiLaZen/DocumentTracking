import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement these — Radix UI's Select (and other primitives)
// call them during pointer interactions, which otherwise throws
// "target.hasPointerCapture is not a function" in any test that opens a
// <Select>. Standard testing-library/Radix workaround.
if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {}
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {}
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }
}
