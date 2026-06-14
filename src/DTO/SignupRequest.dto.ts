export default interface SignupRequestDTO {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organization: {
    name: string;
    slug?: string;
  };
}
