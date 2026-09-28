interface EmailAddress {
  address: string;
  name: string;
}

export interface Attendee {
  emailAddress: EmailAddress;
  type?: string;
}
