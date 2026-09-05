import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  HomeTab: undefined;
  CatalogTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  LanguageSelection: undefined;
  Login: undefined;
  OtpVerify: { phone: string };
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  AddProduct: undefined;
  ProductDetail: { productId: string };
  AIStudio: { productId: string };
  VoiceDescription: { productId: string };
  ProductReviewEdit: { productId: string };
  PricingAssistantDetail: { productId: string };
  Marketplace: undefined;
};

