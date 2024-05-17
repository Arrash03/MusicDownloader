export interface ILink {
    name: string,
    url: string
}

export interface IAlbum {
    name: string,
    musics: ILink[]
}

export interface IArchive {
    single_musics: ILink[],
    album_musics: IAlbum[]
}

export enum Quality {
    _320,
    _128
}
