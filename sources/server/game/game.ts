import WebSocket from 'ws';
import { onError } from './on-error.js';

import type {
	AnyClientMessage,
	AnyServerMessage,
	GameStartedMessage,
	GameAbortedMessage,
	PlayerGameState,
	PlayerRole,
	CellState
} from '../../common/messages.js';

/**
 * Класс игры
 * 
 * Запускает игровую сессию.
 */
class Game
{
	/**
	 * Количество игроков в сессии
	 */
	static readonly PLAYERS_IN_SESSION = 2;
	
	/**
	 * Игровая сессия
	 */
	private _session: WebSocket[];
	/**
	 * Информация о ходах игроков
	 */
	private _playersState!: WeakMap<WebSocket, PlayerRole>;

	private _currentMove!: WebSocket;

	private _gameField!: Array<Array<CellState>>;
	
	/**
	 * @param session Сессия игры, содержащая перечень соединений с игроками
	 */
	constructor( session: WebSocket[] )
	{
		this._session = session;
		
		this._sendStartMessage()
			.then(
				() =>
				{
					this._listenMessages();
				}
			)
			.catch( onError );
	}
	
	/**
	 * Уничтожает данные игровой сессии
	 */
	destroy(): void
	{
		// Можно вызвать только один раз
		this.destroy = () => {};
		
		for ( const player of this._session )
		{
			if (
				( player.readyState !== WebSocket.CLOSED )
				&& ( player.readyState !== WebSocket.CLOSING )
			)
			{
				const message: GameAbortedMessage = {
					type: 'gameAborted',
				};
				
				this._sendMessage( player, message )
					.catch( onError );
				player.close();
			}
		}
		
		// Обнуляем ссылки
		this._session = null as unknown as Game['_session'];
		this._playersState = null as unknown as Game['_playersState'];
	}
	
	/**
	 * Отправляет сообщение о начале игры
	 */
	private _sendStartMessage(): Promise<void[]>
	{
		this._gameField = [];
		this._gameField = Game._generateGameField(this._gameField);

		this._currentMove = this._session[0];
		this._playersState = new WeakMap<WebSocket, PlayerRole>();
		
		const data: GameStartedMessage = {
			type: 'gameStarted',
			myTurn: true,
			gameField: this._gameField,
			role: 'x'
		};
		const promises: Promise<void>[] = [];
		
		for ( const player of this._session )
		{
			promises.push( this._sendMessage( player, data ) );
			this._playersState.set(player, data.role);
			data.myTurn = false;
			data.role = 'o';
		}
		
		return Promise.all( promises );
	}
	
	/**
	 * Отправляет сообщение игроку
	 * 
	 * @param player Игрок
	 * @param message Сообщение
	 */
	private _sendMessage( player: WebSocket, message: AnyServerMessage ): Promise<void>
	{
		return new Promise(
			( resolve, reject ) =>
			{
				player.send(
					JSON.stringify( message ),
					( error ) =>
					{
						if ( error )
						{
							reject();
							
							return;
						}
						
						resolve();
					}
				)
			},
		);
	}
	
	/**
	 * Добавляет слушателя сообщений от игроков
	 */
	private _listenMessages(): void
	{
		for ( const player of this._session )
		{
			player.on(
				'message',
				( data ) =>
				{
					const message = this._parseMessage( data );
					
					this._processMessage( player, message );
				},
			);
			
			player.on( 'close', () => this.destroy() );
		}
	}
	
	/**
	 * Разбирает полученное сообщение
	 * 
	 * @param data Полученное сообщение
	 */
	private _parseMessage( data: unknown ): AnyClientMessage
	{
		if ( typeof data !== 'string' )
		{
			return {
				type: 'incorrectRequest',
				message: 'Wrong data type',
			};
		}
		
		try
		{
			return JSON.parse( data );
		}
		catch ( error )
		{
			return {
				type: 'incorrectRequest',
				message: 'Can\'t parse JSON data: ' + error,
			};
		}
	}
	
	/**
	 * Выполняет действие, соответствующее полученному сообщению
	 * 
	 * @param player Игрок, от которого поступило сообщение
	 * @param message Сообщение
	 */
	private _processMessage( player: WebSocket, message: AnyClientMessage ): void
	{
		switch ( message.type )
		{
			case 'playerMove':
				this._onPlayerMove( player, message.move );
				break;
			
			case 'repeatGame':
				this._sendStartMessage()
					.catch( onError );
				break;
			
			case 'incorrectRequest':
				this._sendMessage( player, message )
					.catch( onError );
				break;
			
			case 'incorrectResponse':
				console.error( 'Incorrect response: ', message.message );
				break;
			
			default:
				this._sendMessage(
					player,
					{
						type: 'incorrectRequest',
						message: `Unknown message type: "${(message as AnyClientMessage).type}"`,
					},
				)
					.catch( onError );
				break;
		}
	}
	

	/**
	 * Заполняем поле в начальное состояние
	 * @param field игровое поле
	 */
	private static _generateGameField(field: Array<Array<CellState>>): Array<Array<CellState>>
	{
		let gameField: Array<Array<CellState>> = field;
		for ( let i: number = 0; i <= 2; i++) 
		{
			gameField.push([]);
			for (let j: number = 0; j <= 2; j++) 
			{
				gameField[i].push('empty');
			}
		}
		return gameField;
	}


	/**
	 * Обрабатывает ход игрока
	 * 
	 * @param currentPlayer Игрок, от которого поступило сообщение
	 * @param moveInfo Информация о ходе
	 */
	private _onPlayerMove( currentPlayer: WebSocket, moveInfo: PlayerGameState ): void
	{
		/** Проверяет текущего игрока */
		if ( this._currentMove !== currentPlayer)
		{
			this._sendMessage(
				currentPlayer,
				{
					type: 'incorrectRequest',
					message: 'Not your turn',
				},
			)
				.catch( onError );
			
			return;
		}
		
		/** Проверяет выход за границы поля */
		if (moveInfo.position.col > 2 || moveInfo.position.row > 2 || moveInfo.position.col < 0 || moveInfo.position.row < 0)
		{
			this._sendMessage(
				currentPlayer,
				{
					type: 'incorrectRequest',
					message: 'Out of field',
				},
			)
				.catch( onError );
			return;
		}

		/** Проверяет, не занята ли клетка */
		if (this._gameField[moveInfo.position.row][moveInfo.position.col] !== 'empty')
		{
			this._sendMessage(
				currentPlayer,
				{
					type: 'incorrectRequest',
					message: 'This cell is oppucied already',
				},
			)
				.catch( onError );
			return;
		}

		
		const currentRole: PlayerRole = this._playersState.get(currentPlayer)!;
		let player2: WebSocket = currentPlayer;
		let endGame: number = 0;

		for ( const player of this._session )
		{
			if (player !== currentPlayer)
			{
				player2 = player;
			}
			endGame |= Number(Game._checkWin( this._gameField, this._playersState.get(player)! )); 
		}
		
		this._currentMove = player2;

		if ( !endGame )
		{
			/** Логика игры */

			// Записывает значение в клетку
			this._gameField[moveInfo.position.row][moveInfo.position.col] = currentRole;
			if (Game._checkWin(this._gameField, this._playersState.get(currentPlayer)!))
			{
				for (const player of this._session )
				{
					this._sendMessage(
						player,
						{
							type: 'gameResult',
							win: Game._checkWin(this._gameField, this._playersState.get(player)!),
						},
					)
						.catch( onError );
				}
			}

			/** Конец логики */

			/** Смена игроков */
			this._sendMessage(
				player2,
				{
					type: 'changePlayer',
					myTurn: true,
					gameField: this._gameField,
					role: (currentRole === 'x' ? 'o' : 'x')
				},
			)
				.catch( onError );

			this._sendMessage (
				currentPlayer,
				{
					type: 'changePlayer',
					myTurn: false,
					gameField: this._gameField,
					role: currentRole
				},
			)
				.catch( onError );

			return;
		}

		/** Отправляет сообщение о проверке на победителя каждому игроку */
		for (const player of this._session )
		{
			this._sendMessage(
				player,
				{
					type: 'gameResult',
					win: Game._checkWin(this._gameField, this._playersState.get(player)!),
				},
			)
				.catch( onError );
		}
	}

	/** Проверяет победителя игры */
	private static _checkWin(field: Array<Array<CellState>>, role: PlayerRole): boolean
	{
		let flag: number = 0;
		let i: number;
		let j: number;

		// Проверяет по строкам
		for (i = 0; i <= 2; i++)
		{
			for (j = 0; j <= 2; j++)
			{
				if (field[i][j] === role)
					flag++;
			}

			if (flag === 3) 
				return true;
			else 
				flag = 0;
		}

		// Проверяет по столбцам
		for (i = 0; i <= 2; i++)
		{
			for (j = 0; j <= 2; j++)
			{
				if (field[j][i] === role)
				flag++;
			}

			if (flag === 3) 
				return true;
			else 
				flag = 0;
		}

		// Проверяет по диагонали
		if ((field[0][0] === role && field[1][1] === role && field[2][2] === role) || (field[2][0] === role && field[1][1] === role && field[0][2] === role))
			return true;

		return false;
	}


}

export {
	Game,
};
