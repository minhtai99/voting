import { generateKey } from './../helpers/cache.helper';
import { PrismaService } from './../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { FilterCrudDto } from './dto/filter-crud.dto';
import { Cache } from 'cache-manager';

@Injectable()
export class CrudService {
  module: any;
  constructor(
    protected readonly cacheManager: Cache,
    protected readonly prisma: PrismaService,
    private readonly cacheKey: string,
  ) {
    this.module = prisma[this.cacheKey];
  }

  async clearCache() {
    const keys: string[] = await this.cacheManager.store.keys();
    keys.forEach((key) => {
      if (key.startsWith(this.cacheKey)) {
        this.cacheManager.del(key);
      }
    });
  }

  async getList(filterCrudDto: FilterCrudDto) {
    const cacheItems = await this.cacheManager.get(
      generateKey(`${this.cacheKey}-list`, filterCrudDto),
    );
    if (!!cacheItems) {
      return cacheItems;
    }

    const page = filterCrudDto.page || 1;
    const size = filterCrudDto.size || 10;
    const where = filterCrudDto.where;
    const select = filterCrudDto.select;
    const orderBy = filterCrudDto.orderBy;

    const skip = (page - 1) * size;

    const total = await this.module.count({
      where,
    });

    const data = await this.module.findMany({
      select,
      where,
      skip,
      take: size,
      orderBy,
    });

    const nextPage = page + 1 > Math.ceil(total / size) ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;

    await this.cacheManager.set(
      generateKey(`${this.cacheKey}-list`, filterCrudDto),
      {
        total: total,
        currentPage: page,
        nextPage,
        prevPage,
        data,
      },
    );
    return {
      total: total,
      currentPage: page,
      nextPage,
      prevPage,
      data,
    };
  }

  async getDataByUnique(where: any, include?: any) {
    const cacheItem = await this.cacheManager.get(
      generateKey(this.cacheKey, where),
    );
    if (!!cacheItem) {
      return cacheItem;
    }
    const data = await this.module.findUnique({
      where,
      include,
    });
    await this.cacheManager.set(generateKey(this.cacheKey, where), data);
    return data;
  }

  async createData(args: { data: any; include?: any }) {
    const data = await this.module.create({
      data: args.data,
      include: args.include,
    });

    this.clearCache();
    return data;
  }

  async updateData(args: { where: any; data: any; include?: any }) {
    const data = await this.module.update({
      where: args.where,
      data: args.data,
      include: args.include,
    });
    this.clearCache();
    return data;
  }

  async upsertData(args: {
    where: any;
    update: any;
    create: any;
    include?: any;
  }) {
    const data = await this.module.upsert({
      where: args.where,
      update: args.update,
      create: args.create,
      include: args.include,
    });
    this.clearCache();
    return data;
  }

  async deleteData(id: number) {
    await this.module.delete({
      where: { id },
    });
    this.clearCache();
  }
}
