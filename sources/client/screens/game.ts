import { PlayerGameState, PlayerRole, CellState } from "../../common/messages";

const playerState: PlayerGameState = {
	position: {
		row: 0,
		col: 0
	},
	role: 'x'
};


/**
 * Заголовок экрана
 */
const title = document.querySelector( 'main.game>h2' ) as HTMLHeadingElement;


/**
 * Игровое поле
 */
// const field = document.querySelector('.field') as HTMLTableElement;

if ( !title )
{
	throw new Error( 'Can\'t find required elements on "game" screen' );
}

/**
 * Обработчик хода игрока
 */
type TurnHandler = ( move: PlayerGameState ) => void;

/**
 * Обработчик хода игрока
 */
let turnHandler: TurnHandler;

function handleCellClick(): void 
{
	const cells: NodeListOf<HTMLElement> = document.querySelectorAll('.field__cell');

	for ( const cell of cells )
	{
		cell.addEventListener(
			'click',
			() =>
			{
				const id = cell.id.split( '-' );

				playerState.position.row = Number(id[0]);
				playerState.position.col = Number(id[1]);
				console.log(event);
				turnHandler && turnHandler( playerState );
			}
		)
	}
	
}

handleCellClick();



/**
 * Обновляет доску
 * @param row позиция по y
 * @param col позиция по x
 * @param cellstate состояние клетки
 */
function renderCell(row: number, col: number, cellstate: CellState): void
{
	console.log('renderCell row: ' + row);
	console.log('renderCell col: ' + col);
	console.log('renderCell cellstate: ' + cellstate);
	const cell = document.getElementById((row + '-' + col)) as HTMLElement;
	if (cellstate === 'x')
	{
		if (!cell.children[1].classList.contains('mark-visible'))
			cell.children[0].classList.add('mark-visible');
	}
	else if (cellstate === 'o')
	{
		if (!cell.children[0].classList.contains('mark-visible'))
			cell.children[1].classList.add('mark-visible');
	}
	else if (cellstate === 'empty') 
	{
		cell.children[0].classList.remove('mark-visible');
		cell.children[1].classList.remove('mark-visible');
	}
}

function renderField(field: Array<Array<CellState>>): void
{
	for (let i: number = 0; i <= 2; i++)
	{
		for (let j: number = 0; j <= 2; j++)
		{
			if (field[i][j] === 'empty')
				continue;
			renderCell(i, j, field[i][j])

		}
	}
}

// function clearField(): void
// {
// 	alert('Очистка поля');
// 	let cell: HTMLElement;
// 	for (let i: number = 0; i <= 2; i++)
// 	{
// 		for (let j: number = 0; j <= 2; j++)
// 		{
// 			cell = document.getElementById((i + '-' + j))!;
// 			cell.children[0].classList.remove('mark-visible');
// 			cell.children[1].classList.remove('mark-visible');
// 		}
// 	}
// }


/**
 * Обновляет экран игры
 * 
 * @param myTurn Ход текущего игрока?
 */
function update( myTurn: boolean, gameField: Array<Array<CellState>>, role: PlayerRole ): void
{
	console.log(gameField);
	console.log(role);

	// clearField();
	renderField(gameField);

	playerState.role = role;
	if ( myTurn )
	{
		title.textContent = 'Ваш ход';
		return;
	}
	
	title.textContent = 'Ход противника';
	// fieldset.disabled = true;
}

/**
 * Устанавливает обработчик хода игрока
 * 
 * @param handler Обработчик хода игрока
 */
function setTurnHandler( handler: TurnHandler ): void
{
	turnHandler = handler;
}

export {
	update,
	setTurnHandler,
};
