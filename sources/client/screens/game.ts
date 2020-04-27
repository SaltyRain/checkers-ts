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
			( event ) =>
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
	// const mark: children = 
	if (cellstate === 'x')
	{
		cell.children[0].classList.add('mark-visible');
	}
	else if (cellstate === 'o')
	{
		cell.children[1].classList.add('mark-visible');
	}
}

function renderField(field: Array<Array<CellState>>): void
{
	console.log('рендерю поле');
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


/**
 * Обновляет экран игры
 * 
 * @param myTurn Ход текущего игрока?
 */
function update( myTurn: boolean, gameField: Array<Array<CellState>>, role: PlayerRole ): void
{
	console.log(gameField);
	console.log(role);

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
