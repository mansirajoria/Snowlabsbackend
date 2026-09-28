const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Migration1704469482651 {
    name = 'Migration1704469482651'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_a0319f844604cccdaa3e281d77"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fa11a3b2767069d872c031df36"`);
        await queryRunner.query(`ALTER TABLE "webinar" DROP CONSTRAINT "UQ_a0319f844604cccdaa3e281d775"`);
        await queryRunner.query(`ALTER TABLE "webinar" ALTER COLUMN "slugName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "webinar" DROP CONSTRAINT "UQ_fa11a3b2767069d872c031df367"`);
        await queryRunner.query(`ALTER TABLE "mock-test" DROP CONSTRAINT "UQ_42321d948728ba7f4b9fb0cd6ca"`);
        await queryRunner.query(`ALTER TABLE "mock-test" DROP CONSTRAINT "UQ_e55c3a48ea2409083120490910a"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "webninar_slugName_unique" ON "webinar" ("slugName") WHERE ("deletedAt" IS NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "webinar_title_unique" ON "webinar" ("title") WHERE ("deletedAt" IS NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "mock_slugName_unique" ON "mock-test" ("slugName") WHERE ("deletedAt" IS NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "mocktest_name_unique" ON "mock-test" ("name") WHERE ("deletedAt" IS NULL)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."mocktest_name_unique"`);
        await queryRunner.query(`DROP INDEX "public"."mock_slugName_unique"`);
        await queryRunner.query(`DROP INDEX "public"."webinar_title_unique"`);
        await queryRunner.query(`DROP INDEX "public"."webninar_slugName_unique"`);
        await queryRunner.query(`ALTER TABLE "mock-test" ADD CONSTRAINT "UQ_e55c3a48ea2409083120490910a" UNIQUE ("slugName")`);
        await queryRunner.query(`ALTER TABLE "mock-test" ADD CONSTRAINT "UQ_42321d948728ba7f4b9fb0cd6ca" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "webinar" ADD CONSTRAINT "UQ_fa11a3b2767069d872c031df367" UNIQUE ("slugName")`);
        await queryRunner.query(`ALTER TABLE "webinar" ALTER COLUMN "slugName" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "webinar" ADD CONSTRAINT "UQ_a0319f844604cccdaa3e281d775" UNIQUE ("title")`);
        await queryRunner.query(`CREATE INDEX "IDX_fa11a3b2767069d872c031df36" ON "webinar" ("slugName") `);
        await queryRunner.query(`CREATE INDEX "IDX_a0319f844604cccdaa3e281d77" ON "webinar" ("title") `);
    }
}
