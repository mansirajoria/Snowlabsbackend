
export function getDateAfterSkip(date:string, skip:number){

  if(!date) return undefined
  const [year, month, day] = date.split("-") 
  const skipDay = Number(day) + skip;
  const endDate = `${year}-${month}-${skipDay}`
  return endDate
  
}
