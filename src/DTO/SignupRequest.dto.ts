export default interface SignupRequestDTO {
  email: string;
  password: string;
  name?: string;
  organization: {
    name: string;
    slug?: string;
  };
}
