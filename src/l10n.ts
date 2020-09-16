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
        "Maps": "Карты",
        "Places": "Места",
        "Blog": "Блог",
        "Articles": "Статьи",
        "About": "О сайте",
        "Access": "Доступ",
        "Season": "Сезон",
        "location": "Местонахождение",
        "size": "Размеры",
        "population_livelihood": "Население и их занятия",
        "military_official_presence": "Использование государством и военными",
        "conservation_status": "Охранный статус",
        "nature": "Природа",
        "sights": "Достопримечательности",
        "tickets": "Билеты",
        "car_access": "Доступность на машине",
        "accommodation": "Проживание",
        "tourist_infrastructure": "Туристическая инфраструктура",
        "built_year": "Год постройки",
        "Up to date as of": "Информация по состоянию на",
        "type-city": "Город",
    },
    "en": {
        "lang-ru": "Русская версия",
        "location": "Location",
        "size": "Size",
        "population_livelihood": "Population and livelihood",
        "military_official_presence": "Military and official presence",
        "conservation_status": "Conservation status",
        "nature": "Nature",
        "sights": "Sights",
        "tickets": "Tickets",
        "car_access": "Car access",
        "accommodation": "Accommodation",
        "tourist_infrastructure": "Tourist infrastructure",
        "built_year": "Built",
        "population": "Population",
        "area": "Area",
        "language_split": "Language split",
        "economy": "Economy",
        "municipal_council": "Municipal council",
        "established": "Established",
        "type-city": "City",
    }
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
