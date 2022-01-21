import {PassportStrategy} from '@nestjs/passport';
import {Injectable} from "@nestjs/common";
import {Strategy, VerifyCallback} from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor() {
        super({
            clientID: process.env['GOOGLE_CLIENT_ID'],
            clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
            callbackURL: process.env.API_BACKEND_SSL_RECOMMENDED + '/google/redirect',
            scope: ['email', 'profile'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
        const {name, emails, photos} = profile;

        const user = {
            name: name.givenName,
            email: emails[0].value,
            avatar: photos[0].value
        };

        done(null, user);
    }
}