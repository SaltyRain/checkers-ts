/**
 * Чем играет игрок?
 */
export type PlayerRole = 'x' | 'o';

/**
 * Состояние клетки
 */
export type CellState = 'x' | 'o' | 'empty';

/**
 * Изначальное состояние поля при запуске игры
 */
export type GameStartedMessage = {
	/** Тип сообщения */
	type: 'gameStarted';
	/** Мой ход? */
	myTurn: boolean;
	/** Игровое поле */
	gameField: Array<Array<CellState>>;
	/** Роль игрока */
	role: PlayerRole;
};

/**
 * Куда походил игрок
 */
export type CellPosition = {
	row: number;
	col: number;
};

/**
 * Состояние игрока
 */
export type PlayerGameState = {
	role: PlayerRole; 
	position: CellPosition; 
};

/**
 * Игра прервана
 */
export type GameAbortedMessage = {
	/** Тип сообщения */
	type: 'gameAborted';
};

/**
 * Ход игрока
 */
export type PlayerMoveMessage = {
	/** Тип сообщения */
	type: 'playerMove';
	/** Ход игрока */
	move: PlayerGameState;
};

/**
 * Результат хода игроков
 */
export type GameResultMessage = {
	/** Тип сообщения */
	type: 'gameResult';
	/** Победа? */
	win: boolean;
};

/**
 * Смена игрока
 */
export type ChangePlayerMessage = {
	/** Тип сообщения */
	type: 'changePlayer';
	/** Мой ход? */
	myTurn: boolean;
	/** Игровое поле */
	gameField: Array<Array<CellState>>;
	/** роль игрока */
	role: PlayerRole;
};

/**
 * Повтор игры
 */
export type RepeatGame = {
	/** Тип сообщения */
	type: 'repeatGame';
};

/**
 * Некорректный запрос клиента
 */
export type IncorrectRequestMessage = {
	/** Тип сообщения */
	type: 'incorrectRequest';
	/** Сообщение об ошибке */
	message: string;
};

/**
 * Некорректный ответ сервера
 */
export type IncorrectResponseMessage = {
	/** Тип сообщения */
	type: 'incorrectResponse';
	/** Сообщение об ошибке */
	message: string;
};

/**
 * Сообщения от сервера к клиенту
 */
export type AnyServerMessage =
	| GameStartedMessage
	| GameAbortedMessage
	| GameResultMessage

	| ChangePlayerMessage

	| IncorrectRequestMessage
	| IncorrectResponseMessage;

/** 
 * Сообщения от клиента к серверу
 */
export type AnyClientMessage =
	| PlayerMoveMessage
	
	| RepeatGame

	| IncorrectRequestMessage
	| IncorrectResponseMessage;
