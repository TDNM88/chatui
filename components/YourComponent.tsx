import { useState } from "react"

export function YourComponent() {
  const [state, setState] = useState("")

  return (
    <div>
      <p>{state}</p>
    </div>
  )
} 