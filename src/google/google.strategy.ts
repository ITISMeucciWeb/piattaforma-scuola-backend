import {PassportStrategy} from '@nestjs/passport';
import {Injectable} from "@nestjs/common";
import {Strategy} from "passport-google-oauth20";
import {GoogleUserInterface} from "./googleUser.interface";
import {UserService} from "../user/user.service";
import {JwtService} from "@nestjs/jwt";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private jwtService: JwtService, private readonly userService: UserService) {
        super({
            clientID: process.env['GOOGLE_CLIENT_ID'],
            clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
            callbackURL: process.env.API_BACKEND_SSL_RECOMMENDED + '/google/redirect',
            scope: ['email', 'profile'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
        const {name, emails, photos} = profile;

        const user: GoogleUserInterface = {
            name: name.givenName,
            surname: name.familyName,
            email: emails[0].value,
            avatar: photos[0].value,
        };

        const finalUser = await this.userService.processUser(user);

        return await this.jwtService.signAsync(finalUser.toJSON());
    }
}
