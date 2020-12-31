import * as PIXI from 'pixi.js'

const app = new PIXI.Application({
    antialias: true,
    backgroundColor: 0x27282B,
})
const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
app.renderer.resize(vw, vh * .9)

function normalize(x: number, inp: number, out: number) {
    return x * out / inp
}

class Visualizer {
    private titles: string[]
    private data: number[][]
    private years: number[] = []
    private indices: number[][] = []
    private maxData = 0

    private yearText!: PIXI.Text
    private arrow!: PIXI.Graphics
    private entries: Array<[PIXI.Text, PIXI.Graphics]> = []

    private curRun = 0
    private curYearIdx = 0
    private startY = 130
    private entryHeight = 30
    private fpyear = 30

    constructor(heading: string, titles: string[], data: number[][]) {
        this.titles = titles

        data.sort((a, b) => { // sort data by years
            return a[0] - b[0]
        })

        for (const row of data) {
            this.years.push(row.shift() ?? 0)
            this.maxData = Math.max(this.maxData, Math.max.apply(null, row))

            let tmpArray = Array.from(Array(row.length).keys())
            tmpArray.sort((a, b) => {
                return row[a] < row[b] ? -1 : row[a] > row[b] ? 1 : a < b ? -1 : 1
            })
            let yearIndice = new Array<number>(row.length)
            for (let idx = 0; idx < row.length; ++idx) {
                yearIndice[tmpArray[idx]] = idx
            }
            this.indices.push(yearIndice)
        }
        this.data = data

        this.initGraphics(heading)
        app.ticker.add(delta => this.loop(delta))
    }

    private initGraphics(heading: string) {
        const center = app.renderer.width / 2
        const headingText = new PIXI.Text(heading, { fill: "white", align: "center", fontSize: 20 })
        headingText.position.set(center, 30)
        headingText.anchor.set(0.5)
        app.stage.addChild(headingText)

        this.yearText = new PIXI.Text("Year: " + this.years[0], { fill: "white", align: "center", fontSize: 18 })
        this.yearText.position.set(center, 55)
        this.yearText.anchor.set(0.5)
        app.stage.addChild(this.yearText)

        this.arrow = new PIXI.Graphics()
        this.arrow.lineStyle(1, 0xFFFFFF, 1)
        const startX = app.renderer.width / 6
        this.arrow.moveTo(startX, 100)
        this.arrow.lineTo(app.renderer.width * 11 / 12, 100)
        app.stage.addChild(this.arrow)

        const nbDivide = 6
        const dataDiff = this.maxData / nbDivide
        const lineSpace = this.arrow.width / nbDivide
        for (let idx = 0; idx <= nbDivide; ++idx) {
            let yearX = new PIXI.Text(String(Math.round(idx * dataDiff)), {
                fill: "white", align: "center", fontSize: 10
            })
            yearX.position.set(startX + idx * lineSpace, 90)
            yearX.anchor.set(0.5)
            app.stage.addChild(yearX)
        }

        for (let idx = 0; idx < this.titles.length; ++idx) {
            const posY = this.startY + this.indices[0][idx] * this.entryHeight
            const color = posY - 70 * (0xFFFFFF - 450000)

            const city = new PIXI.Text(this.titles[idx], { fill: "white", fontSize: 15 })
            city.position.set(startX - 15, posY + (this.entryHeight >> 1))
            city.anchor.set(1, 0.5)
            app.stage.addChild(city)

            const rectangle = new PIXI.Graphics()
            const yearWidth = normalize(this.data[0][idx], this.maxData, this.arrow.width)
            rectangle.lineStyle(1, 0xFFFFFF, 1)
            rectangle.beginFill(color) // ???
            rectangle.drawRect(0, 0, yearWidth, this.entryHeight - 3)
            rectangle.endFill()
            rectangle.position.set(startX, posY)
            app.stage.addChild(rectangle)

            this.entries.push([city, rectangle])
        }
    }

    private loop(delta: number) { // 1 year / 1s
        if (++this.curRun > this.fpyear) {
            this.curRun = 0
            if (++this.curYearIdx >= this.years.length) {
                this.curYearIdx = 0
            }
        }
        let nextYearIdx = this.curYearIdx + 1
        if (nextYearIdx >= this.years.length) {
            nextYearIdx = 0
        }

        this.yearText.text = "Year: " + this.years[nextYearIdx].toString()

        let idx = 0
        for (let [city, item] of this.entries) {
            const curWidth = normalize(this.data[this.curYearIdx][idx], this.maxData, this.arrow.width)
            const nextWidth = normalize(this.data[nextYearIdx][idx], this.maxData, this.arrow.width)
            item.width += (nextWidth - curWidth) / this.fpyear

            const curY = this.startY + this.indices[this.curYearIdx][idx] * this.entryHeight
            const nextY = this.startY + this.indices[nextYearIdx][idx] * this.entryHeight
            item.y += (nextY - curY) / this.fpyear
            city.y += (nextY - curY) / this.fpyear

            ++idx
        }
    }
}

export { app, Visualizer }
