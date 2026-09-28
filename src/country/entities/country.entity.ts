import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('country')
export class Country {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  alpha_2: string;

  @Column()
  alpha_3: string;

  @Column()
  country_code: string;
}
