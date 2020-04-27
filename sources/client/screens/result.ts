/**
 * Сообщение с итогом игры
 */
const message = document.querySelector( '.game-result' ) as HTMLParagraphElement;
/**
 * Кнопка перезапуска игры
 */
const restart = document.querySelector( '.button--restart' ) as HTMLButtonElement;

if ( !message || !restart )
{
	throw new Error( 'Can\'t find required elements on "result" screen' );
}

// restart.addEventListener('click', clearField);

// function clearField(): void
// {
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
 * Обновляет экран завершения игры
 * 
 * @param result Результат, с которым игра завершилась
 */
function update( result: 'win' | 'loose' | 'abort' ): void
{
	restart.hidden = false;
	
	let text: string;
	
	switch ( result )
	{
		case 'win':
			text = 'Вы выиграли';
			break;
		
		case 'loose':
			text = 'Вы проиграли';
			break;
		
		case 'abort':
			text = 'Игра прервана';
			restart.hidden = true;
			break;
		
		default:
			throw new Error( `Wrong game result "${result}"` );
	}
	
	message.textContent = text;
}

/**
 * Устанавливает обработчик перезапуска игры
 * 
 * @param listener Обработчик перезапуска игры
 */
function setRestartHandler( listener: ( event: MouseEvent ) => void ): void
{
	restart.addEventListener( 'click', listener );
}

export {
	update,
	setRestartHandler,
};
