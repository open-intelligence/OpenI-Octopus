
export function formatValidateError(details=[], formatMap={}) {
  let em = []
  for (let d of details) {
    if(formatMap[d.key]){
      em.push(formatMap[d.key])
    } else {
      em.push(d.key)
    }
  }
  debugger
  return em
}