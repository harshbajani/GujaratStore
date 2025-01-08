export declare type SignUpData = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export declare type ActionResponse = {
  success: boolean;
  message: string;
  data?: { tempUserId?: string };
};
