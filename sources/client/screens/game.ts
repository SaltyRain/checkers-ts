/**
 * Заголовок экрана
 */
const title = document.querySelector( 'main.game>h2' ) as HTMLHeadingElement;
/**
 * Форма для действий игрока
 */
const form = document.forms.namedItem( 'player-roll' )!;
/**
 * Набор полей на форме
 */
const fieldset = form.querySelector( 'fieldset' )!;
/**
 * Поле с загаданным числом
 */
const numberInput = form.elements.namedItem( 'number' ) as HTMLInputElement;

if ( !title || !form || !fieldset || !numberInput )
{
	throw new Error( 'Can\'t find required elements on "game" screen' );
}

/**
 * Обработчик хода игрока
 */
type TurnHandler = ( number: number ) => void;

/**
 * Обработчик хода игрока
 */
let turnHandler: TurnHandler;

form.addEventListener( 'submit', onSubmit );

/**
 * Обрабатывает отправку формы
 * 
 * @param event Событие отправки
 */
function onSubmit( event: Event ): void
{
	event.preventDefault();
	
	turnHandler && turnHandler( numberInput.valueAsNumber );
}

/**
 * Обновляет экран игры
 * 
 * @param myTurn Ход текущего игрока?
 */
function update( myTurn: boolean ): void
{
	if ( myTurn )
	{
		title.textContent = 'Ваш ход';
		fieldset.disabled = false;
		
		return;
	}
	
	title.textContent = 'Ход противника';
	fieldset.disabled = true;
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
