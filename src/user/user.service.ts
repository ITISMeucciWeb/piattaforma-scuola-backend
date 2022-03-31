import { Injectable } from '@nestjs/common';
import {GoogleUserInterface} from "../google/googleUser.interface";
import {InjectModel} from "@nestjs/mongoose";
import {Role, User, UserDocument} from "./user.entity";
import {Model, Types} from "mongoose";
import {Field, InputType, Int, ObjectType} from "@nestjs/graphql";
import {ClassService, Teacher} from "../class/class.service";

@InputType()
export class StudentInfo {
    @Field()
    division: string;
    @Field()
    class: number;
    @Field()
    name: string;
    @Field()
    surname: string;
    @Field()
    fiscalCode: string;
    @Field(() => [String])
    disorders: [string];
}

@ObjectType()
export class UserData {
    @Field(()=>String)
    _id: Types.ObjectId;

    @Field(()=>String)
    name: string;

    @Field(()=>String)
    surname: string;

    @Field(()=>String, {nullable: true})
    email: string;

    @Field(()=>String)
    role: string

    @Field(()=>String, {nullable: true})
    fiscalCode: string;

    @Field(()=>String, {nullable: true})
    avatar: string;

    @Field(()=>Boolean)
    manual: boolean;

    @Field(()=>Boolean, {nullable: true})
    hasDisorders: boolean;

    @Field(()=>Int, {nullable: true})
    class: number;

    @Field(()=>String, {nullable: true})
    division: string;
}

@ObjectType()
export class UserList {
    @Field(()=>Int)
    count: number;
    @Field(()=>[UserData])
    users: UserData[];
}

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private UserModel: Model<UserDocument>, private ClassService: ClassService) {}

    async getUsersByName(limit: number, from: number, nameSearch: string): Promise<UserList>{
        return (await this.UserModel.aggregate([
            {
                '$match': {
                    '$expr': {
                        '$regexMatch': {
                            'input': {
                                '$concat': [
                                    '$name', ' ', '$surname'
                                ]
                            },
                            'regex': nameSearch,
                            'options': 'i'
                        }
                    }
                }
            },
            {
                '$lookup': {
                    'from': 'classes',
                    'localField': '_id',
                    'foreignField': 'students',
                    'as': 'classArray'
                }
            }, {
                '$addFields': {
                    'class': {
                        '$first': '$classArray.class'
                    },
                    'division': {
                        '$first': '$classArray.division'
                    }
                }
            }, {
                '$project': {
                    '_id': 1,
                    hasDisorders: {$anyElementTrue: "$disorders"},
                    'manual': 1,
                    'surname': 1,
                    'role': 1,
                    'name': 1,
                    'avatar': 1,
                    'class': 1,
                    'email': 1,
                    'division': 1,
                    'fiscalCode': 1
                }
            },
            {
                '$facet': {
                    'count': [
                        {
                            '$count': 'count'
                        }
                    ],
                    'users': [
                        {
                            '$skip': from
                        },
                        {
                            '$limit': limit
                        }
                    ]
                }
            }, {
                $addFields: {
                    count: {
                        $first: '$count.count'
                    }
                }
            }
        ]).exec())[0] as unknown as Promise<UserList>;
    }

    async importStudents(students: [StudentInfo]){
        try{
            await this.UserModel.deleteMany({role: Role.Student, manual: false}).exec();
            const insertedUsers = await this.UserModel.insertMany(students.map(student => {
                return {
                    role: Role.Student,
                    manual: false,
                    class: student.class,
                    division: student.division,
                    name: student.name,
                    surname: student.surname,
                    fiscalCode: student.fiscalCode,
                    disorders: student.disorders
                }
            }));

            await this.ClassService.setClassesForNewUsers(insertedUsers, students);
            return insertedUsers;
        }catch (e) {
            console.error(e);
            return false;
        }
    }

    async importTeachers(teachers: Teacher[]){
        await this.UserModel.deleteMany({role: Role.Teacher, manual: false}).exec();
        return await this.UserModel.insertMany(teachers.map(teacher => {
            return {
                name: teacher.name,
                surname: teacher.surname,
                role: Role.Teacher
            }
        }));
    }

    async processUser(user: GoogleUserInterface){
        const dbUser = await this.UserModel.findOne({name: user.name, surname: user.surname}, {}, {collation: {locale: "it", strength: 1}}).exec();
        if(dbUser.email && dbUser.email !== user.email){
            throw new Error("Email non corrispondente");
        }else if(!dbUser.email){
            dbUser.email = user.email;
            dbUser.avatar = user.avatar;
            await dbUser.save();
        }else if(dbUser.avatar !== user.avatar){
            dbUser.avatar = user.avatar;
            await dbUser.save();
        }

        return dbUser || await new this.UserModel(user).save();
    }
}
