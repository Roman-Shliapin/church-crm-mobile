import type { NavigatorScreenParams } from '@react-navigation/native';
import type { AdminNeed } from '../../services/adminNeeds';

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

export type AdminStackParamList = {
    AdminHub: undefined;
    AdminNeeds: undefined;
    AdminNeedDetail: { need: AdminNeed };
    AdminPeople: undefined;
};

export type NeedsStackParamList = {
    NeedsList: undefined;
    NeedDetail: { needId: string };
    CreateNeed: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Needs: NavigatorScreenParams<NeedsStackParamList> | undefined;
    Profile: undefined;
    Admin: NavigatorScreenParams<AdminStackParamList> | undefined;
};
