# inquirer-table-prompt [![npm version](https://badge.fury.io/js/inquirer-table-prompt.svg)](https://badge.fury.io/js/inquirer-table-prompt)

> A table-like prompt for [Inquirer.js](https://github.com/SBoudrias/Inquirer.js)

![Screen capture of the table prompt](screen-capture.gif)

## Installation

```
npm install --save inquirer-table-prompt
```

## Usage

After registering the prompt, set any question to have `type: "table"` to make use of this prompt.

The result will be an array, containing the value for each row.

```js
inquirer.registerPrompt("table", require("./index"));

inquirer
  .prompt([
    {
      type: "table",
      name: "workoutPlan",
      message: "Choose your workout plan for next week",
      columns: [
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
        },
        {
          name: "None",
          value: undefined
        }
      ],
      rows: [
        {
          name: "Monday",
          value: 0
        },
        {
          name: "Tuesday",
          value: 1
        },
        {
          name: "Wednesday",
          value: 2
        },
        {
          name: "Thursday",
          value: 3
        },
        {
          name: "Friday",
          value: 4
        },
        {
          name: "Saturday",
          value: 5
        },
        {
          name: "Sunday",
          value: 6
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
```

### Options

- `columns`: Array of options to display as columns. Follows the same format as Inquirer's `choices`
- `rows`: Array of options to display as rows. Follows the same format as Inquirer's `choices`
- `pageSize`: Number of rows to display per page
