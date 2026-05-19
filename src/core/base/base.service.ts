import { PrismaService } from 'src/prisma/prisma.service';

export class BaseService {
  constructor(
    protected prisma: PrismaService,
    protected model: any,
  ) {}

  async findAll(params?: any) {
    return this.model.findMany(params);
  }

  async findOne(id: string) {
    return this.model.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.model.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.model.delete({
      where: { id },
    });
  }
}
