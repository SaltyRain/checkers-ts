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
	 * Обрабатывает ход игрока
	 * 
	 * @param currentPlayer Игрок, от которого поступило сообщение
	 * @param moveInfo Информация о ходе
	 */
	private _onPlayerMove( currentPlayer: WebSocket, moveInfo: PlayerGameState ): void
	{
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
		
		if (moveInfo.position.col > 3 || moveInfo.position.row > 3 || moveInfo.position.col < 1 || moveInfo.position.col < 1)
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

		if (moveInfo.clicked === true)
		{
			this._sendMessage(
				currentPlayer,
				{
					type: 'incorrectRequest',
					message: 'Cell is occupied',
				},
			)
				.catch( onError );
			return;
		}

		const currentRole: PlayerRole = this._playersState.get(currentPlayer)!;

		// this._playersState.set( currentPlayer, currentPlayerNumber );
		
		// let maxNumber: number = currentPlayerNumber;
		// let maxNumberPlayer: WebSocket = currentPlayer;

		let player2: WebSocket = currentPlayer;
		let endGame: number = 0;		
		for ( const player of this._session )
		{
			if (player !== currentPlayer)
			{
				player2 = player;
			}
			endGame |= Number(Game._checkWin( this._gameField, this._playersState.get(player)! )); // ДОПИСАТЬ
			
			// const playerNumber = this._playersState.get( player );
			
			// if ( playerNumber == null )
			// {
			// 	this._sendMessage(
			// 		player,
			// 		{
			// 			type: 'changePlayer',
			// 			myTurn: true,
			// 		},
			// 	)
			// 		.catch( onError );
			// 	this._sendMessage(
			// 		currentPlayer,
			// 		{
			// 			type: 'changePlayer',
			// 			myTurn: false,
			// 		},
			// 	)
			// 		.catch( onError );
				
			// 	return;
			// }
			
			// if ( playerNumber > maxNumber )
			// {
			// 	maxNumber = playerNumber;
			// 	maxNumberPlayer = player;
			// }
		}
		
		this._currentMove = player2;

		// for ( const player of this._session )
		// {
		// 	this._sendMessage(
		// 		player,
		// 		{
		// 			type: 'gameResult',
		// 			win: ( player === maxNumberPlayer ),
		// 		},
		// 	)
		// 		.catch( onError );
		// }

		if ( !endGame )
		{
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

	private static _checkWin(field: Array<Array<CellState>>, role: string): boolean
	{
		// ДОПИСАТЬ
		const r = role;
		console.log(r);
		const f = field[0][0];
		console.log(f);
		return false; 
	}


}

export {
	Game,
};
