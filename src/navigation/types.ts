import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  OtpVerification: undefined;
  Register: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  IncomingTrip: undefined;
  TripNavigation: undefined;
  DemandMap: undefined;
};

export type ProfileStackParamList = {
  MonthlyServices: undefined;
  ProfileMain: undefined;
  Vehicle: undefined;
  Incentives: undefined;
  DocumentCenter: undefined;
  LostItems: undefined;
  TourismProfile: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  TripsTab: undefined;
  WalletTab: undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}




