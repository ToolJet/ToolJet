import { IsString, IsOptional, ValidateNested, MinLength, MaxLength, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class Color {
  @IsString()
  light: string;

  @IsString()
  dark: string;
}

class Colors {
  @ValidateNested()
  @Type(() => Color)
  primary: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  secondary?: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  tertiary?: Color;
}

class TextColors {
  @ValidateNested()
  @Type(() => Color)
  primary: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  placeholder?: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  disabled?: Color;
}

class Text {
  @IsString()
  font: string;

  @ValidateNested()
  @Type(() => TextColors)
  colors: TextColors;
}

class BorderRadius {
  @IsNumber()
  default: number;

  @IsNumber()
  small: number;

  @IsNumber()
  large: number;
}

class BorderColors {
  @ValidateNested()
  @Type(() => Color)
  default: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  weak?: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  disabled?: Color;
}

class Border {
  @ValidateNested()
  @Type(() => BorderRadius)
  radius: BorderRadius;

  @ValidateNested()
  @Type(() => BorderColors)
  colors: BorderColors;
}

class SystemStatusColors {
  @ValidateNested()
  @Type(() => Color)
  success: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  error?: Color;

  @IsOptional()
  @ValidateNested()
  @Type(() => Color)
  warning?: Color;
}

class SystemStatus {
  @ValidateNested()
  @Type(() => SystemStatusColors)
  colors: SystemStatusColors;
}

class AppBackgroundColor {
  @IsString()
  light: string;

  @IsString()
  dark: string;
}

class SurfaceColors {
  @ValidateNested()
  @Type(() => AppBackgroundColor)
  appBackground: AppBackgroundColor;

  @ValidateNested()
  @Type(() => Color)
  surface1: Color;

  @ValidateNested()
  @Type(() => Color)
  surface2: Color;

  @ValidateNested()
  @Type(() => Color)
  surface3: Color;
}

class Surface {
  @ValidateNested()
  @Type(() => SurfaceColors)
  colors: SurfaceColors;
}

class Brand {
  @ValidateNested()
  @Type(() => Colors)
  colors: Colors;
}

export class Definition {
  @ValidateNested()
  @Type(() => Brand)
  brand: Brand;

  @ValidateNested()
  @Type(() => Text)
  text: Text;

  @ValidateNested()
  @Type(() => Border)
  border: Border;

  @ValidateNested()
  @Type(() => SystemStatus)
  systemStatus: SystemStatus;

  @ValidateNested()
  @Type(() => Surface)
  surface: Surface;
}

export class CreateThemeDto {
  @IsString()
  @MinLength(5, { message: 'Theme name should contain more than 5 characters' })
  @MaxLength(100, { message: 'Theme name should be Max 100 characters' })
  name: string;

  @IsString()
  organizationId: string;

  @ValidateNested()
  @Type(() => Definition)
  definition: Definition;

  @IsOptional()
  isDefault?: boolean;
}

export class UpdateThemeDefinitionDto {
  @ValidateNested()
  @Type(() => Definition)
  definition: Definition;
}

export class UpdateThemeNameDto {
  @IsString()
  name: string;
}

export class UpdateThemeDefaultDto {
  @IsBoolean()
  isDefault: boolean;
}
