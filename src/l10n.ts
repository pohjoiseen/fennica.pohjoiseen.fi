import {LANGUAGES} from './const';

const strings: {[lang: string]: {[key: string]: string}} = {
    "ru": {
        "lang-en": "English version",
        "Back to Top": "Наверх",
        "Previous": "Назад",
        "Next": "Далее",
        "Home": "Домой",
        "Published on": "Опубликовано",
        "Continue reading": "Читать дальше",
        "Map": "Карта",
        "Places": "Места",
        "Blog": "Блог",
        "Articles": "Статьи",
        "Contents": "Содержание",
        "About Website": "О сайте",
        "Read more": "Подробнее",
        "Zoom in to see less notable places": "Приблизьте карту, чтобы увидеть больше мест"
    },
    "en": {
        "lang-ru": "Русская версия",
    },
    "fi": {
        "Previous": "Edellinen",
        "Next": "Seuraava",
        "Home": "Etusivu",
        "Published on": "Julkaistu",
        "Map": "Kartta",
        "Places": "Paikat",
        "Blog": "Blogi",
        "Articles": "Artikkelit",
        "Contents": "Sisältö",
        "About Website": "Sivustosta",
        "Read more": "Lue lisää",
    },
};

export default function _(str: string, targetLang?: string | undefined) {
    if (!targetLang) {
        targetLang = LANGUAGES[0];
    }
    if (strings[targetLang] && strings[targetLang][str]) {
        return strings[targetLang][str];
    }
    return str;
}
