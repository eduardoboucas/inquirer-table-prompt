const chalk = require("chalk");
const cliCursor = require("cli-cursor");
const figures = require("figures");
const Base = require("inquirer/lib/prompts/base");
const Choices = require("inquirer/lib/objects/choices");
const observe = require("inquirer/lib/utils/events");
const Paginator = require("inquirer/lib/utils/paginator");
const Table = require("cli-table");
const { map, takeUntil } = require("rxjs/operators");

class MatrixSelectPrompt extends Base {
  /**
   * Initialise the prompt
   *
   * @param  {Object} questions
   * @param  {Object} rl
   * @param  {Object} answers
   */
  constructor(questions, rl, answers) {
    super(questions, rl, answers);

    this.columns = new Choices(this.opt.columns, []);
    this.pointer = 0;
    this.horizontalPointer = 0;
    this.rows = new Choices(this.opt.rows, []);
    this.values = this.columns.filter(() => true).map(() => undefined);

    this.paginator = new Paginator(this.screen);
  }

  /**
   * Start the inquirer session
   *
   * @param  {Function} callback
   * @return {MatrixSelectPrompt}
   */
  _run(callback) {
    this.done = callback;

    const events = observe(this.rl);
    const validation = this.handleSubmitEvents(
      events.line.pipe(map(this.getCurrentValue.bind(this)))
    );
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    events.keypress.forEach(({ key }) => {
      switch (key.name) {
        case "left":
          return this.onLeftKey();

        case "right":
          return this.onRightKey();
      }
    });

    events.normalizedUpKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onUpKey.bind(this));
    events.normalizedDownKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onDownKey.bind(this));
    events.spaceKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onSpaceKey.bind(this));

    if (this.rl.line) {
      this.onKeypress();
    }

    cliCursor.hide();
    this.render();

    return this;
  }

  getCurrentValue() {
    const currentValue = [];

    this.rows.forEach((row, rowIndex) => {
      currentValue.push(this.values[rowIndex]);
    });

    return currentValue;
  }

  onDownKey() {
    const length = this.rows.realLength;

    this.pointer = this.pointer < length - 1 ? this.pointer + 1 : 0;
    this.render();
  }

  onEnd(state) {
    this.status = "answered";
    this.spaceKeyPressed = true;

    this.render();

    this.screen.done();
    cliCursor.show();
    this.done(state.value);
  }

  onError(state) {
    this.render(state.isValid);
  }

  onLeftKey() {
    const length = this.columns.realLength;

    this.horizontalPointer =
      this.horizontalPointer > 0 ? this.horizontalPointer - 1 : length - 1;
    this.render();
  }

  onRightKey() {
    const length = this.columns.realLength;

    this.horizontalPointer =
      this.horizontalPointer < length - 1 ? this.horizontalPointer + 1 : 0;
    this.render();
  }

  onSpaceKey() {
    const value = this.columns.get(this.horizontalPointer).value;

    this.values[this.pointer] = value;
    this.spaceKeyPressed = true;
    this.render();
  }

  onUpKey() {
    const length = this.rows.realLength;

    this.pointer = this.pointer > 0 ? this.pointer - 1 : length - 1;
    this.render();
  }

  render(error) {
    let message = this.getQuestion();
    let bottomContent = "";

    if (!this.spaceKeyPressed) {
      message +=
        "(Press " +
        chalk.cyan.bold("<space>") +
        " to select, " +
        chalk.cyan.bold("<Up and Down>") +
        " to move rows, " +
        chalk.cyan.bold("<Left and Right>") +
        " to move columns)";
    }

    const table = new Table({
      head: [""].concat(
        this.columns.pluck("name").map(name => chalk.reset.bold(name))
      )
    });

    this.rows.forEach((row, rowIndex) => {
      const columnValues = [];

      this.columns.forEach((column, columnIndex) => {
        const isSelected =
          this.status !== "answered" &&
          this.pointer === rowIndex &&
          this.horizontalPointer === columnIndex;
        const value =
          column.value === this.values[rowIndex]
            ? figures.radioOn
            : figures.radioOff;

        columnValues.push(
          `${isSelected ? "[" : " "} ${value} ${isSelected ? "]" : " "}`
        );
      });

      const chalkModifier =
        this.status !== "answered" && this.pointer === rowIndex
          ? chalk.reset.bold
          : chalk.reset;

      table.push({
        [chalkModifier(row.name)]: columnValues
      });
    });

    message += "\n\n" + table.toString();

    if (error) {
      bottomContent = chalk.red(">> ") + error;
    }

    this.screen.render(message, bottomContent);
  }
}

module.exports = MatrixSelectPrompt;
