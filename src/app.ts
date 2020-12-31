import { app, Visualizer } from './pixi'
import * as XLSX from 'xlsx'

let visualizer: Visualizer
let running = true

function onReady() {
    document.body.appendChild(app.view)

    let excelFile = document.getElementById('excelFile') as HTMLElement
    excelFile.addEventListener('change', onSelectSheet)

    let pauseBtn = document.getElementById('pause') as HTMLElement
    pauseBtn.addEventListener('click', event => {
        if (running) {
            app.ticker.stop()
            pauseBtn.innerHTML = "Play"
        } else {
            app.ticker.start()
            pauseBtn.innerHTML = "Pause"
        }
        running = !running
    })
}

if (document.readyState != 'loading') {
    onReady()
} else {
    document.addEventListener('DOMContentLoaded', onReady)
}

async function onSelectSheet(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    const buffer = await file?.arrayBuffer() ?? new ArrayBuffer(0)

    const isAccept = buffer.byteLength < 1e6 ? true :
        confirm(`This file is ${buffer.byteLength} bytes. Your browser may lock up during this process. Continue?`)
    if (isAccept) {
        let binData = ""
        for (const byte of new Uint8Array(buffer)) {
            binData += String.fromCharCode(byte)
        }
        const workbook = XLSX.read(binData, {
            type: 'binary', cellFormula: false, cellHTML: false, cellText: false
        })
        let data = XLSX.utils.sheet_to_json(
            workbook.Sheets[workbook.SheetNames[0]], { header: 1 }
        )
        let titles = data.shift() as string[]
        titles.shift() // remove first empty cell

        visualizer = new Visualizer(file?.name ?? "Heading", titles, data as number[][])
    }
}


