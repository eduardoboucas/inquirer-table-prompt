const chalk = require('chalk')
const cliCursor = require('cli-cursor')
const figures = require('figures')
const Base = require('inquirer/lib/prompts/base')
const Choices = require('inquirer/lib/objects/choices')
const observe = require('inquirer/lib/utils/events')
const Table = require('cli-table3')
const { map, takeUntil } = require('rxjs/operators')

class TablePrompt extends Base {
  constructor (questions, rl, answers) {
    super(questions, rl, answers)

    // add column for select radiobutton, and column width
    this.opt.columns.unshift({ name: '', value: undefined })
    this.opt.colWidths.unshift(6)

    this.columns = new Choices(this.opt.columns, [])
    this.rows = new Choices(this.opt.rows, [])
    this.values = this.rows.filter(() => true).map(() => undefined)

    // Bail if no enabled rows
    const enabledRows = this.opt.rows.filter(row => !row.disabled)
    if (enabledRows.length <= 0) {
      this.onEnd()
    }

    // Set starting pointer to first valid row
    this.pointer = 0
    if (this.rows.length > 0) {
      if (this.rows.get(this.pointer).disabled) {
        this.pointer = this.findNextRow(1)
      }
    }

    this.pageSize = this.opt.pageSize || 5
  }

  _run (callback) {
    this.done = callback

    const events = observe(this.rl)
    const validation = this.handleSubmitEvents(
      events.line.pipe(map(this.getCurrentValue.bind(this)))
    )
    validation.success.forEach(this.onEnd.bind(this))
    validation.error.forEach(this.onError.bind(this))

    events.normalizedUpKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onUpKey.bind(this))
    events.normalizedDownKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onDownKey.bind(this))
    events.spaceKey
      .pipe(takeUntil(validation.success))
      .forEach(this.onSpaceKey.bind(this))

    if (this.rl.line) {
      this.onKeypress()
    }

    cliCursor.hide()
    this.render()

    return this
  }

  getCurrentValue () {
    // return only unique and defined values
    return [...new Set(this.values)].filter(j => j != null)
  }

  /**
   * Given an offset, find the next enabled row, starting
   * at the current pointer position.
   *
   * @param {number} offset Search offset
   * @returns {number} Pointer to next enabled row
   */
  findNextRow (offset) {
    let newPointer = this.pointer
    let selectedOption
    const length = this.rows.length

    while (!selectedOption || selectedOption.disabled) {
      newPointer =
        (newPointer + offset + length) % length
      selectedOption = this.rows.get(newPointer)
    }
    return newPointer
  }

  onDownKey () {
    this.pointer = this.findNextRow(1)
    this.render()
  }

  onEnd (state) {
    this.status = 'answered'
    this.spaceKeyPressed = true

    this.render()

    this.screen.done()
    cliCursor.show()
    this.done(state.value)
  }

  onError (state) {
    this.render(state.isValid)
  }

  onSpaceKey () {
    const isSet = this.values[this.pointer]
    const value = this.rows.get(this.pointer).value

    // toggle
    if (isSet) {
      this.values[this.pointer] = undefined
    } else {
      this.values[this.pointer] = value
    }

    this.spaceKeyPressed = true
    this.render()
  }

  onUpKey () {
    this.pointer = this.findNextRow(-1)
    this.render()
  }

  paginate () {
    const middleOfPage = Math.floor(this.pageSize / 2)
    const firstIndex = Math.max(0, this.pointer - middleOfPage)
    const lastIndex = Math.min(
      firstIndex + this.pageSize - 1,
      this.rows.length - 1
    )
    const lastPageOffset = this.pageSize - 1 - lastIndex + firstIndex

    return [Math.max(0, firstIndex - lastPageOffset), lastIndex]
  }

  render (error) {
    let message = this.getQuestion()
    let bottomContent = ''

    if (!this.spaceKeyPressed) {
      message +=
        '(Press ' +
        chalk.cyan.bold('<space>') +
        ' to select, ' +
        chalk.cyan.bold('<Up and Down>') +
        ' to move rows)'
    }

    const [firstIndex, lastIndex] = this.paginate()
    const tableOptions = {
      head: this.columns.pluck('name').map(name => name),
      style: {}
    }

    if (this.opt.wrapOnWordBoundary === false) {
      tableOptions.wrapOnWordBoundary = this.opt.wrapOnWordBoundary
    }

    if (this.opt.wordWrap) {
      tableOptions.wordWrap = this.opt.wordWrap
    }

    if (this.opt.colWidths) {
      tableOptions.colWidths = this.opt.colWidths
    }

    if (this.opt.style) {
      tableOptions.style = { ...tableOptions.style, ...this.opt.style }
    }

    const table = new Table(tableOptions)

    this.rows.forEach((row, rowIndex) => {
      if (rowIndex < firstIndex || rowIndex > lastIndex) return

      const columnValues = []

      this.columns.forEach((column, columnIndex) => {
        const isSelected = this.pointer === rowIndex

        let value

        if (row.disabled) {
          value = '-'
        } else {
          if (this.values[rowIndex]) {
            value = figures.radioOn
          } else {
            value = figures.radioOff
          }
        }

        let cellValue
        if (columnIndex === 0) {
          // the first column is the radiobutton column
          cellValue = isSelected ? `${figures.pointer}${value}` : ` ${value}`
        } else {
          cellValue = row[column.name] || ''
        }

        // eslint-disable-next-line no-unused-vars
        const chalkModifier =
          this.status !== 'answered' && this.pointer === rowIndex
            ? chalk.reset.bold.cyan
            : chalk.reset

        const { wordWrap = false, wrapOnWordBoundary = true } = tableOptions
        const {
          wordWrap: columnWordWrap = wordWrap,
          wrapOnWordBoundary: columnWrapOnWordBoundary = wrapOnWordBoundary
        } = this.opt.columns[columnIndex] // cell overrides

        if (columnIndex === 0) {
          // no wordWrap in the select column
          columnValues.push({
            content: isSelected ? chalk.blue(cellValue) : cellValue,
            wordWrap: false
          })
        } else {
          columnValues.push({
            content: cellValue,
            wordWrap: columnWordWrap,
            wrapOnWordBoundary: columnWrapOnWordBoundary
          })
        }
      })

      table.push(columnValues)
    })

    message += '\n\n' + table.toString()
    if (this.opt.bottomContent) {
      bottomContent = this.opt.bottomContent + '\n'
    }

    if (error) {
      bottomContent += '\n' + chalk.red('>> ') + error
    }

    this.screen.render(message, bottomContent)
  }
}

module.exports = TablePrompt
