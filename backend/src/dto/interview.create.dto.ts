import { IsDateString, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class InterviewCreateDto {
    @IsNotEmpty()
    @IsString()
    title: string;
    @IsNotEmpty()
    @IsString()
    description?: string;
    @IsNotEmpty()
    startTime: string; // ISO String: 2024-05-20T10:00:00Z
    @IsNotEmpty()
    endTime: string;
    @IsNotEmpty()
    @IsNumber()
    applicationId: number;
}