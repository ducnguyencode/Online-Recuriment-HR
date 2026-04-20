import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';

class PanelMemberDto {
    @IsString()
    @IsNotEmpty()
    employeeId: string;

    @IsString()
    @IsNotEmpty()
    role: string;
}

export class InterviewCreateDto {
    @IsNotEmpty()
    @IsString()
    title: string;
    @IsNotEmpty()
    @IsString()
    description?: string;
    @IsNotEmpty()
    @IsDateString()
    startTime: string;
    @IsNotEmpty()
    @IsDateString()
    endTime: string;
    @IsNotEmpty()
    @IsNumber()
    applicationId: number;
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PanelMemberDto)
    panel: PanelMemberDto[];
}