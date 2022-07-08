/**
 * Content types which are common both in generator and in client context.
 */

/**
 * Front matter for .article.XX.md files.
 */
export interface ArticleDefinition {
    title: string;
    prev?: string;
    next?: string;
    updated: string;
    draft?: boolean;
}

export interface Article {
    name: string;
    data: ArticleDefinition;
    content: string;
}

export interface Geo {
    title?: string;
    subtitle?: string;
    description?: string;
    titleImage?: string;
    anchor?: string;
    lat: number;
    lng: number;
    zoom: number;
    icon?: string;
    maps?: string[];
}

/**
 * Front matter for .post.XX.md files.
 */
export interface PostDefinition {
    title: string;
    titleImage?: string;
    titleImageOffsetY?: number;
    titleImageInText?: boolean;
    titleImageCaption?: string;
    date?: string;
    coatOfArms?: string | [string, number] | ((string | [string, number])[]);
    description?: string;
    category?: string;
    tags?: [string, string][];
    geo?: Geo | Geo[];
    draft?: boolean;
}

export interface Post {
    name: string;
    data: PostDefinition;
    content: string;
    prev?: string;
    next?: string;
}

