import { useState } from "react";

function Tasks(props) {
   console.log(props);
   return <ul>{props.tasks.map((task) => 
   <li>{task.title}</li>
   )}</ul>;
}

export default Tasks;