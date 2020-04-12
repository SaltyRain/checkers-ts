import { PlayerGameState, PlayerRole, CellState } from "../../common/messages";

const playerState: PlayerGameState = {
	clicked: false,
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

function handleCellClick(): void 
{
	const cells = document.querySelectorAll('.field__cell');
	cells.forEach(function(cell: Node) {
		cell.addEventListener('click', function(evt: Event): void {
			console.log(cell);
			const plRole: PlayerRole = 'x';
			console.log(plRole);
			// console.log(playerState);
			// const playerMark = cell.
			// let id = cell.id.split('-');
			// ...
			// playerState.position.row = Number(id[0]);
			// playerState.position.col = Number(id[1]);
			console.log(evt);
			playerState.clicked = false; // ???
			turnHandler &&  turnHandler( playerState );
		})
	})
}

handleCellClick();

/**
 * Обработчик хода игрока
 */
type TurnHandler = ( move: PlayerGameState ) => void;

/**
 * Обработчик хода игрока
 */
let turnHandler: TurnHandler;




/**
 * Обновляет экран игры
 * 
 * @param myTurn Ход текущего игрока?
 */
function update( myTurn: boolean, gameField: Array<Array<CellState>>, role: PlayerRole ): void
{
	console.log(gameField);
	console.log(role);
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
