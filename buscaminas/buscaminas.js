let rows = 20
let columns = 20
let cellSize = 27
let mines = rows * columns * 0.1
let onGame = true
let gameStarted = false
let marks = 0

async function settings() {
    const {
        value: settings
    } = await swal.fire({
        title: "Ajustes",
        html: `
            Dificultad (minas/área)
            <br>
            <br>
            <input onchange="cambiarValor()" oninput="this.onchange()" id="difficulty" type="range" min="10" max="40" step="1" value="${100 * mines / (rows * columns)}" onchange="">
            <span id="value-difficulty">${100 * mines / (rows * columns)}%</span>
            <br>
            <br>
            Filas
            <br>
            <input class="swal2-input" type="number" value=${rows} placeholder="rows" id="rows" min="10" max="1000" step="1">
            <br>
            Columnas
            <br>
            <input class="swal2-input" type="number" value=${columns} placeholder="columns" id="columns" min="10" max="1000" step="1">
            <br>
            `,
        confirmButtonText: "Establecer",
        confirmButtonColor: "#00224D",
        cancelButtonText: "Cancelar",
        cancelButtonColor: "red",
        showCancelButton: true,
        background: "#ddd",
        color: "black",
        preConfirm: () => {
            return {
                columns: document.getElementById("columns").value,
                rows: document.getElementById("rows").value,
                difficulty: document.getElementById("difficulty").value
            }
        }
    })
    if (!settings) {
        return
    }
    rows = Math.floor(settings.rows)
    columns = Math.floor(settings.columns)
    mines = Math.floor(columns * rows * settings.difficulty / 100)
    newGame()
}


//Generar el table
tableGenerator = () => {
    let html = ""
    for (let r = 0; r < rows; r++) {
    html += '<tr>'
        for (let c = 0; c < columns; c++) {
        html += '<td id="cell-' + c + '-' + r + '">'
        
        html += '</td>'
        }
    html += '</tr>'
    }

    let htmlTable = document.getElementById('table')
    htmlTable.innerHTML = html
    htmlTable.style.width = columns*cellSize+'px'
    htmlTable.style.height = rows*cellSize+'px'
    htmlTable.style.background = ''
}

//vaciar el table
tableClean = () => {
    table = []
    for (let c = 0; c < columns; c++) {
        table.push([])
    }
}

//colocar las mines
mineSetter = () => {
    for (let i = 0; i < mines; i++) {
        let c
        let r
        do {
            c = Math.floor(Math.random() * columns)//Genera una columna aleatoria
            r = Math.floor(Math.random() * rows)//Genera una fila aleatoria
        } while (table[c][r]) {//Verifica si en una celda no hay mina
            table[c][r] = { value: -1 }//Se inserta una mina en una celda disponible
        }
        
    }
}

mineHelper = () => {
    for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
                if (!table[c][r]) {
                    let counter = 0
                    //Se recorren todas las celdas que estan alrededor de la misma
                    for (let i = -1; i <= 1; i++) {
                        for (let j = -1; j <= 1; j++) {
                            if (i == 0 && j == 0) {
                                continue
                            }
                            try {//evitar errores con las posiciones negativas
                                if (table[c + i][r + j].value == -1) {
                                    counter++
                                }
                            } catch (e) {
                                
                            }
                        };
                        
                    }
                    table[c][r] = {value: counter}
                }
            }
    }
}

tableGameGenerator = () => {
    tableClean()
    mineSetter()
    mineHelper()
}

//Una vez generado el table html se le agregan los eventos del clic a cada una de las celdas para que el usuario pueda interacturar con el juego
addEvents = () => {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            let cell = document.getElementById('cell-' + c + '-' + r)
            cell.addEventListener('dblclick',me=>{
                doubleClick(cell, c, r, me)
            })
            cell.addEventListener('mouseup',me=>{
                simpleClick(cell, c, r, me)
            })
        }
    }
}

//Destapa las celdas a las que se le dan doble clic
doubleClick = (cell, c, r, me) => {
    if(!onGame){
        return
    }
    areaDiscover(c , r)
    tableRefresh()
}

//comportamiento del clic derecho e izquierdo para descubir o marcarlas para protegerlas
simpleClick = (cell, c, r, me) => {
    if(!onGame){
        return//el juego ha finalizado
    }
    if(table[c][r].status == 'discovered') {
        return//las celdas descubiertas no pueden ser marcadas o redescubiertas
    }
    switch (me.button) {
        case 0://Clic izquierdo
            if (table[c][r].status == 'marked') {
                break
            }
            //Si el jugador al iniciar una nueva partida seleciona una celda con mina se genera un nuevo table
            while (!gameStarted && table[c][r].value == -1) {
                tableGameGenerator()
            }
            table[c][r].status = 'discovered'
            gameStarted = true
            // si clicamos en una celda en blanco, descubre todas las celdas vacias en el area
            if (table[c][r].value == 0) {
                areaDiscover(c,r)
            }
            break;
        case 1://Boton central o rueda
            break;
        case 2://boton derecho
            if (table[c][r].status == 'marked') {
                table[c][r].status = undefined
                marks--
            } else {
                table[c][r].status = 'marked'
                marks++
            }
            break;
        default:
            break;
    }
    tableRefresh()
}

areaDiscover = (c, r) => {
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i == 0 && j == 0) {
                continue
            }
            try {//evitar errores con las posiciones negativas
                if (table[c + i][r + j].status != 'discovered') {
                    if (table[c + i][r + j].status != 'marked') {
                        table[c + i][r + j].status = 'discovered'
                        if (table[c + i][r + j].value == 0) {
                            areaDiscover(c + i, r + j)
                        }
                    }
                }
            } catch (e) {
                
            }
        }
    }
}


tableRefresh = () => {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            let cell = document.getElementById('cell-' + c + '-' + r)
            if(table[c][r].status== 'discovered'){
                cell.style.boxShadow = 'none'
                switch (table[c][r].value) {
                    case -1:
                        cell.innerHTML = '<i class="fa-duotone fa-solid fa-bomb" style="--fa-primary-color: #030303; --fa-secondary-color: #f28202; --fa-secondary-opacity: 1;"></i>'
                        cell.style.background = 'white'
                        cell.style.border = 'none'
                        break;
                    case 0:
                        break;
                    default:
                        cell.innerHTML = table[c][r].value
                        break;
                }
            }
            if(table[c][r].status== 'marked') {
                cell.innerHTML = '<i class="fa-duotone fa-solid fa-flag" style="--fa-primary-color: #000000; --fa-secondary-color: #000000; --fa-secondary-opacity: 1;"></i>'
                cell.style.background = '#9FE2BF'
            }
            if(table[c][r].status== undefined) {
                cell.innerHTML = ''
                
            }
        }
    }
    winner()
    loser()
    minesPanelUpdate()
}

winner = () => {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            if (table[c][r].status != 'discovered') {
                if (table[c][r].value == -1) {
                    continue
                } else {
                    return
                }
            }
        }
    }
    let htmlTable = document.getElementById('table')
    htmlTable.style.background = 'green'
    onGame = false
}

loser = () => {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            if (table[c][r].value == -1) {
                if (table[c][r].status == 'discovered') {
                    let htmlTable = document.getElementById('table')
                    htmlTable.style.background = 'red'
                    onGame = false
                }
            }
        }
    }
    if(onGame) {
        return
    }
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            if (table[c][r].value == -1) {
                let cell = document.getElementById('cell-' + c + '-' + r)
                cell.innerHTML = '<i class="fa-duotone fa-solid fa-bomb" style="--fa-primary-color: #030303; --fa-secondary-color: #f28202; --fa-secondary-opacity: 1;"></i>'
                cell.style.color = 'black'
            }
        }
    }
}

minesPanelUpdate = () => {
    let panel = document.getElementById('mines')
    panel.innerHTML = mines - marks
}

variablesReset = () => {
    marks = 0
    onGame = true
    gameStarted = false
}

newGame = () => {
    variablesReset()
    tableGenerator()
    addEvents()
    tableGameGenerator()
    tableRefresh()
}

newGame()