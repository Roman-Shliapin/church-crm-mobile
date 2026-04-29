import type { NavigatorScreenParams } from '@react-navigation/native';
import type { AdminNeed } from '../../services/adminNeeds';

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

/** Кореневий Stack поверх табів (адмін-маршрути). */
export type RootStackParamList = {
    MainTabs: undefined;
    Admin: undefined;
    AdminNeeds: { initialCategory?: 'archived' | 'active' } | undefined;
    AdminNeedDetail: { need: AdminNeed };
    Members: undefined;
    Candidates: undefined;
};

export type NeedsStackParamList = {
    NeedsList: undefined;
    NeedDetail: { needId: string };
    CreateNeed: undefined;
};

export type BibleStackParamList = {
    BibleBooks: undefined;
    BibleChapters: { bookid: number; bookName: string; chapters: number };
    BibleReader: {
        bookid: number;
        bookName: string;
        chapter: number;
        chapters: number;
    };
};

export type MainTabParamList = {
    Home: undefined;
    Bible: NavigatorScreenParams<BibleStackParamList> | undefined;
    Needs: NavigatorScreenParams<NeedsStackParamList> | undefined;
    Profile: undefined;
};
