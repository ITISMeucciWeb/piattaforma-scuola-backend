import {Prop, Schema, SchemaFactory}  from "@nestjs/mongoose";
import {Field, ObjectType, registerEnumType} from "@nestjs/graphql";
import {Document, Types} from "mongoose";

export enum Role {
    Admin = 'Admin',
    Headmaster = 'Headmaster',
    Secretariat = 'Secretariat',
    Teacher = "Teacher",
    Student = "Student"
}

registerEnumType(Role, {
    name: 'Roles',
    description: 'Roles of the user',
});

@ObjectType()
@Schema()
export class User {
    @Field(()=>String)
    _id: Types.ObjectId;

    @Field(()=>String)
    @Prop({required: true})
    name: string;

    @Field(()=>String)
    @Prop({required: true})
    surname: string;

    //TODO: add validation on name and surname
    @Field(()=>String, {nullable: true})
    @Prop()
    fiscalCode: string;

    @Field(()=>String)
    @Prop()
    avatar: string;

    @Field(()=>String, {defaultValue: Role.Student, nullable: true})
    @Prop({required: true, default: Role.Student})
    role: string;

    @Field(()=>String)
    @Prop({unique: false, required: false})
    email: string;

    @Field(()=>Boolean)
    @Prop({required: true, default: false})
    manual: boolean;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
