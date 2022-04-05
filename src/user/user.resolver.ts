import {Args, Int, Mutation, Query, Resolver} from '@nestjs/graphql';
import {StudentInfo, UserData, UserList, UserService} from "./user.service";
import {Types} from "mongoose";

@Resolver()
export class UserResolver {
    constructor(private readonly userService: UserService) {
    }

    @Mutation(() => Boolean)
    async importStudents(@Args('students', {type: () => [StudentInfo]}) students: [StudentInfo]) {
        return Boolean(await this.userService.importStudents(students));
    }

    @Query(() => UserList)
    async getUsersByName(@Args("limit", {type: () => Int, defaultValue: 10}) limit: number,
                            @Args("from", {type: () => Int, defaultValue: 0}) from: number,
                            @Args("nameSearch", {defaultValue: ""}) nameSearch: string) {
        if (limit > 20) {
            limit = 20;
        }
        return await this.userService.getUsersByName(limit, from, nameSearch);
    }

    @Query(() => [UserData])
    async getMyStudents() {
        return await this.userService.getStudentsByTeacherId(new Types.ObjectId("6229e285b2e589903d4267ae"))
    }

}
