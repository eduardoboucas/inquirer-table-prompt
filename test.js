const inquirer = require('inquirer')

inquirer.registerPrompt("table", require("./index"));

inquirer
  .prompt([
    {
      type: "table",
      name: "select template",
      bottomContent: "some bottom content",
      message: "Choose the template you want",
      wordWrap: true,
      wrapOnWordBoundary: false,
      colWidths: [ 10, 10, 10, 10],
      columns: [
        { 
          name: "Select",
          value: undefined
        },
        {
          name: "Arms",
          value: "arms"
        },
        {
          name: "Legs",
          value: "legs"
        },
        {
          name: "Cardio",
          value: "cardio"
        }
      ],
      rows: [
        {
          value: 'a',
          Arms: "some thing 1",
          Legs: "some thing 2"
        },
        {
          value: 'b',
          Arms: "some thing 3",
          Legs: "some thing 4"
        },
        {
          value: 'c',
          Arms: "some thing 5",
          Legs: "some thing 6"
        },
        {
          value: 'd',
          Arms: "some thing 7",
          Legs: "some thing 8",
          Cardio: "some cardio"
        },
        {
          value: 'e',
          Arms: "some thing 9",
          Legs: "some thing 10"
        },
        {
          value: 'f',
          Arms: "some thing 11",
          Legs: "some thing 12"
        }
      ]
    }
  ])
  .then(answers => {
    /*
    { workoutPlan:
      [ 'arms', 'legs', 'cardio', undefined, 'legs', 'arms', undefined ] }    
    */
    console.log(answers);
  });