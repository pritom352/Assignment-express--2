export interface IUser {
    name:string,
    email:string,
    password:string,

    role?:string
}

export interface IIssue {
    title:string,
    description:string,
    status?:string,
    priority?:string,
    assigned_to?:number
}