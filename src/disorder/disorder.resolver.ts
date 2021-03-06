import {Args, Mutation, Query, Resolver} from '@nestjs/graphql';
import {Disorder, DisorderData, DisorderDocument, InputDisorder} from "./disorder.entity";
import {DisorderService} from "./disorder.service";
import {FileUpload, GraphQLUpload} from "graphql-upload";
import {stream2buffer} from "../utils";

@Resolver()
export class DisorderResolver {
    constructor(private readonly DisorderService: DisorderService) {
    }

    @Query(()=>[DisorderData])
    async getDisordersList(){
        return this.DisorderService.getDisordersList();
    }

    @Mutation(()=>Boolean)
    async newDisorder(@Args("disorderDocument", {type: ()=> InputDisorder}) disorderDocument: DisorderDocument,
                      @Args("pdf", {type: ()=> GraphQLUpload}) {createReadStream}: FileUpload){
        disorderDocument.pdf = await stream2buffer(createReadStream());
        try {
            this.DisorderService.newDisorder(disorderDocument);
        } catch (e) {
            return false;
        }
        return true
    }

    @Query(()=>Disorder)
    async getDisorder(@Args("id") id: string){
        const result = await this.DisorderService.getDisorder(id);
        return {
            ...result,
            pdf: result.pdf.toString()
        };
    }
}
